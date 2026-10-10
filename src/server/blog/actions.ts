"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type FormState, fieldErrors } from "@/lib/form";

import { audit } from "../audit";
import { CONTENT_ROLES, HttpError, requireRole } from "../auth/guards";
import { db } from "../db";
import { readingMinutes, slugify } from "./markdown";

function failure(error: unknown): FormState {
  if (error instanceof HttpError) return { message: error.message };
  if (error instanceof z.ZodError) return { fieldErrors: fieldErrors(error), message: "Check the highlighted fields." };
  console.error("[blog] action failed", error);
  return { message: "Something went wrong. Try again." };
}

function refresh(slug?: string) {
  revalidatePath("/blog", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}

const optional = z
  .string()
  .trim()
  .transform((v) => v || null);

const postSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(8, "Give the post a title of at least 8 characters.").max(160),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(90)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^$/, "Use lowercase letters, numbers and hyphens."),
    excerpt: z.string().trim().min(40, "Write at least a sentence (40+ characters).").max(320),
    body: z.string().min(200, "The body is too short to publish as an article."),
    keyTakeaway: optional.pipe(z.string().max(600).nullable()),
    faq: z.array(z.object({ q: z.string().trim().min(3), a: z.string().trim().min(3) })).max(12),
    sources: z.array(z.object({ title: z.string().trim().min(2), url: z.url("Each source needs a full URL.") })).max(20),
    categoryId: optional,
    tags: z.array(z.string().trim().toLowerCase().min(2).max(40)).max(10),
    coverImageId: optional,
    coverAlt: optional,
    authorTitle: optional,
    featured: z.boolean(),
    metaTitle: optional.pipe(z.string().max(70, "Search engines cut titles after about 60 characters.").nullable()),
    metaDescription: optional.pipe(z.string().max(170, "Keep it under about 160 characters.").nullable()),
    focusKeyword: optional,
    canonicalUrl: optional.pipe(z.url().nullable()),
    noindex: z.boolean(),
  })
  .refine((p) => !p.coverImageId || p.coverAlt, { path: ["coverAlt"], message: "Describe the cover image for screen readers." });

// Fixed routes under /blog that a post slug must not shadow.
const RESERVED_SLUGS = new Set(["preview", "category", "tag", "feed", "feed-xml", "page"]);

export type PostInput = z.input<typeof postSchema>;
export type SaveResult = FormState & { id?: string; slug?: string };

export async function savePost(input: PostInput): Promise<SaveResult> {
  try {
    const user = await requireRole(CONTENT_ROLES);
    const p = postSchema.parse(input);
    const slug = p.slug || slugify(p.title);
    if (!slug) throw new HttpError(422, "Add a slug in Latin letters.");
    if (RESERVED_SLUGS.has(slug)) return { fieldErrors: { slug: "That slug is reserved by the site. Pick another." } };

    const clash = await db.blogPost.findFirst({ where: { slug, NOT: p.id ? { id: p.id } : undefined }, select: { id: true } });
    if (clash) return { fieldErrors: { slug: "Another post already uses this slug." }, message: "Check the highlighted fields." };

    const data = {
      title: p.title,
      slug,
      excerpt: p.excerpt,
      body: p.body,
      keyTakeaway: p.keyTakeaway,
      faq: p.faq,
      sources: p.sources,
      categoryId: p.categoryId,
      tags: [...new Set(p.tags)],
      coverImageId: p.coverImageId,
      coverAlt: p.coverAlt,
      authorTitle: p.authorTitle,
      featured: p.featured,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      focusKeyword: p.focusKeyword,
      canonicalUrl: p.canonicalUrl,
      noindex: p.noindex,
      readingMinutes: readingMinutes(p.body),
    };

    let post;
    if (p.id) {
      const before = await db.blogPost.findUnique({ where: { id: p.id }, select: { slug: true } });
      if (!before) throw new HttpError(404, "That post no longer exists.");
      post = await db.blogPost.update({ where: { id: p.id }, data });
      await audit(user, "blog.update", { type: "BlogPost", id: post.id });
      if (before.slug !== slug) refresh(before.slug);
    } else {
      post = await db.blogPost.create({
        data: { ...data, authorId: user.id, authorName: `${user.firstName} ${user.lastName}` },
      });
      await audit(user, "blog.create", { type: "BlogPost", id: post.id });
    }
    refresh(post.slug);
    return { ok: true, id: post.id, slug: post.slug, message: "Saved." };
  } catch (error) {
    return failure(error);
  }
}

const statusSchema = z.object({
  id: z.string(),
  status: z.enum(["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
  publishAt: z.string().optional(),
});

/** Publishing stamps the time; scheduling needs a time in the future. */
export async function setPostStatus(input: z.input<typeof statusSchema>): Promise<FormState> {
  try {
    const user = await requireRole(CONTENT_ROLES);
    const { id, status, publishAt } = statusSchema.parse(input);
    const post = await db.blogPost.findUnique({ where: { id } });
    if (!post) throw new HttpError(404, "That post no longer exists.");

    let publishedAt = post.publishedAt;
    if (status === "PUBLISHED") publishedAt = post.status === "PUBLISHED" && post.publishedAt ? post.publishedAt : new Date();
    if (status === "SCHEDULED") {
      const when = publishAt ? new Date(publishAt) : null;
      if (!when || Number.isNaN(when.getTime()) || when <= new Date()) {
        throw new HttpError(422, "Pick a publish time in the future.");
      }
      publishedAt = when;
    }
    if (status === "PUBLISHED" || status === "SCHEDULED") {
      if (post.body.length < 200 || post.excerpt.length < 40) throw new HttpError(422, "Finish the excerpt and body before publishing.");
    }

    await db.blogPost.update({ where: { id }, data: { status, publishedAt } });
    await audit(user, "blog.status", { type: "BlogPost", id }, { from: post.status, to: status });
    refresh(post.slug);
    return { ok: true, message: status === "SCHEDULED" ? "Scheduled." : "Updated." };
  } catch (error) {
    return failure(error);
  }
}

/** Permanent, so it's limited to administrators. Archive is the everyday option. */
export async function deletePost(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const user = await requireRole(["ADMIN"]);
    const id = z.string().parse(formData.get("id"));
    const post = await db.blogPost.delete({ where: { id } });
    await audit(user, "blog.delete", { type: "BlogPost", id }, { slug: post.slug, title: post.title });
    refresh(post.slug);
    return { ok: true, message: "Deleted." };
  } catch (error) {
    return failure(error);
  }
}

/** Form-action wrapper so status buttons can sit in a plain form. */
export async function setPostStatusForm(_prev: FormState, formData: FormData): Promise<FormState> {
  return setPostStatus({
    id: String(formData.get("id") ?? ""),
    status: String(formData.get("status") ?? "") as z.input<typeof statusSchema>["status"],
  });
}

// ─── Categories ───────────────────────────────────────────────────────────

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name the category.").max(60),
  slug: z.string().trim().toLowerCase().max(60).optional(),
  description: optional.pipe(z.string().max(240).nullable()),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const user = await requireRole(CONTENT_ROLES);
    const input = categorySchema.parse(Object.fromEntries(formData));
    const slug = slugify(input.slug || input.name);
    if (!slug) return { fieldErrors: { slug: "Add a slug in Latin letters." } };
    const clash = await db.blogCategory.findFirst({ where: { slug, NOT: input.id ? { id: input.id } : undefined } });
    if (clash) return { fieldErrors: { slug: "Another category uses this slug." } };
    const data = { name: input.name, slug, description: input.description, sortOrder: input.sortOrder };
    const cat = input.id
      ? await db.blogCategory.update({ where: { id: input.id }, data })
      : await db.blogCategory.create({ data });
    await audit(user, "blog.category", { type: "BlogCategory", id: cat.id }, { op: input.id ? "update" : "create" });
    refresh();
    return { ok: true, message: "Saved." };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const user = await requireRole(["ADMIN"]);
    const id = z.string().parse(formData.get("id"));
    // Posts in it fall back to uncategorised (onDelete: SetNull).
    await db.blogCategory.delete({ where: { id } });
    await audit(user, "blog.category", { type: "BlogCategory", id }, { op: "delete" });
    refresh();
    return { ok: true, message: "Deleted." };
  } catch (error) {
    return failure(error);
  }
}

// ─── Editorial calendar ───────────────────────────────────────────────────

/**
 * Turns the Markdown files in content/blog into "In review" drafts. Never
 * publishes and never overwrites: a month that already has a post, or a slug
 * that's taken, is skipped.
 */
export async function importCalendar(): Promise<FormState> {
  try {
    const user = await requireRole(["ADMIN"]);
    const { readCalendarFiles } = await import("./calendar");
    const files = await readCalendarFiles();
    const categories = await db.blogCategory.findMany({ select: { id: true, slug: true } });
    let created = 0;
    let skipped = 0;
    for (const { article: a } of files) {
      if (!a) continue;
      const exists = await db.blogPost.findFirst({ where: { OR: [{ plannedFor: a.month }, { slug: a.slug }] }, select: { id: true } });
      if (exists) {
        skipped += 1;
        continue;
      }
      const post = await db.blogPost.create({
        data: {
          slug: a.slug,
          title: a.title,
          excerpt: a.excerpt,
          body: a.body,
          keyTakeaway: a.keyTakeaway ?? null,
          faq: a.faq,
          sources: a.sources,
          tags: a.tags,
          categoryId: categories.find((c) => c.slug === a.category)?.id ?? null,
          focusKeyword: a.focusKeyword ?? null,
          metaDescription: a.metaDescription ?? null,
          status: "REVIEW",
          plannedFor: a.month,
          authorId: user.id,
          authorName: "Imedica Clinical Team",
          readingMinutes: readingMinutes(a.body),
        },
      });
      await audit(user, "blog.create", { type: "BlogPost", id: post.id }, { source: "calendar", month: a.month });
      created += 1;
    }
    refresh();
    revalidatePath("/admin/blog/calendar");
    return { ok: true, message: created ? `Imported ${created} draft${created === 1 ? "" : "s"} for review.${skipped ? ` ${skipped} already existed.` : ""}` : "Nothing new to import." };
  } catch (error) {
    return failure(error);
  }
}

const PENDING_NOTE = "*Drafted for Imedica Field Notes. Awaiting review by an emergency physician before publication.*";
const PUBLISHED_NOTE = "*Drafted for Imedica Field Notes. Physician review of this article is pending.*";

/**
 * Imports anything missing, then publishes every calendar post that isn't
 * live yet, dated now and a second apart in calendar order so the newest
 * month lists first. The review note at the end of each post stays honest.
 */
export async function publishCalendar(): Promise<FormState> {
  try {
    const user = await requireRole(["ADMIN"]);
    const imported = await importCalendar();
    if (!imported.ok) return imported;
    const posts = await db.blogPost.findMany({
      where: { plannedFor: { not: null }, status: { not: "PUBLISHED" } },
      orderBy: { plannedFor: "asc" },
      select: { id: true, slug: true, body: true, status: true },
    });
    const start = Date.now() - posts.length * 1000;
    for (const [i, p] of posts.entries()) {
      await db.blogPost.update({
        where: { id: p.id },
        data: { status: "PUBLISHED", publishedAt: new Date(start + i * 1000), body: p.body.replace(PENDING_NOTE, PUBLISHED_NOTE) },
      });
      await audit(user, "blog.status", { type: "BlogPost", id: p.id }, { from: p.status, to: "PUBLISHED", source: "calendar" });
      refresh(p.slug);
    }
    refresh();
    revalidatePath("/admin/blog/calendar");
    return { ok: true, message: posts.length ? `Published ${posts.length} article${posts.length === 1 ? "" : "s"}.` : "Everything is already published." };
  } catch (error) {
    return failure(error);
  }
}
