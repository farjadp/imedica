import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import { db } from "../db";

export const PAGE_SIZE = 9;

/**
 * What the public can see: published posts, plus scheduled ones whose time
 * has come. Scheduling needs no cron, because the check runs on every read.
 */
export function liveWhere(now = new Date()): Prisma.BlogPostWhereInput {
  return {
    OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED" }],
    publishedAt: { lte: now },
  };
}

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImageId: true,
  coverAlt: true,
  authorName: true,
  readingMinutes: true,
  publishedAt: true,
  featured: true,
  tags: true,
  category: { select: { slug: true, name: true } },
} satisfies Prisma.BlogPostSelect;

export type PostCard = Prisma.BlogPostGetPayload<{ select: typeof cardSelect }>;

export async function listLivePosts({
  categorySlug,
  tag,
  q,
  page = 1,
}: {
  categorySlug?: string;
  tag?: string;
  q?: string;
  page?: number;
}) {
  const where: Prisma.BlogPostWhereInput = {
    AND: [
      liveWhere(),
      categorySlug ? { category: { slug: categorySlug } } : {},
      tag ? { tags: { has: tag } } : {},
      q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { excerpt: { contains: q, mode: "insensitive" } },
              { body: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };
  const skip = (Math.max(1, page) - 1) * PAGE_SIZE;
  const [posts, total] = await Promise.all([
    db.blogPost.findMany({ where, select: cardSelect, orderBy: { publishedAt: "desc" }, skip, take: PAGE_SIZE }),
    db.blogPost.count({ where }),
  ]);
  return { posts, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getFeaturedPost() {
  return db.blogPost.findFirst({
    where: { AND: [liveWhere(), { featured: true }] },
    select: cardSelect,
    orderBy: { publishedAt: "desc" },
  });
}

export async function getLivePost(slug: string) {
  return db.blogPost.findFirst({
    where: { AND: [liveWhere(), { slug }] },
    include: { category: { select: { slug: true, name: true } } },
  });
}

/** Same category first, then shared tags, then the newest. */
export async function getRelatedPosts(post: { id: string; categoryId: string | null; tags: string[] }, take = 3) {
  const candidates = await db.blogPost.findMany({
    where: { AND: [liveWhere(), { id: { not: post.id } }] },
    select: { ...cardSelect, categoryId: true },
    orderBy: { publishedAt: "desc" },
    take: 30,
  });
  const score = (c: (typeof candidates)[number]) =>
    (c.categoryId && c.categoryId === post.categoryId ? 2 : 0) + c.tags.filter((t) => post.tags.includes(t)).length;
  return candidates
    .map((c, i) => ({ c, s: score(c), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, take)
    .map(({ c }) => c);
}

export async function getCategoriesWithCounts() {
  const categories = await db.blogCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { posts: { where: liveWhere() } } } },
  });
  return categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name, description: c.description, count: c._count.posts }));
}

export async function getCategory(slug: string) {
  return db.blogCategory.findUnique({ where: { slug } });
}

/** For the sitemap and the RSS feed. */
export async function listLiveForFeeds(take = 500) {
  return db.blogPost.findMany({
    where: { AND: [liveWhere(), { noindex: false }] },
    select: { slug: true, title: true, excerpt: true, authorName: true, publishedAt: true, updatedAt: true, category: { select: { name: true } } },
    orderBy: { publishedAt: "desc" },
    take,
  });
}
