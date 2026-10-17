import "server-only";

import { env } from "../env";

export const BLOG_NAME = "Imedica Field Notes";

export function absolute(path: string) {
  return new URL(path, env().APP_URL).toString();
}

export function coverUrl(coverImageId: string | null) {
  return coverImageId ? `/blog-media/${coverImageId}` : null;
}

const publisher = () => ({
  "@type": "Organization",
  name: "Ashavid Inc.",
  url: absolute("/"),
});

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absolute(it.path) })),
  };
}

export function collectionLd(name: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absolute(path),
    isPartOf: { "@type": "WebSite", name: "Imedica", url: absolute("/") },
    publisher: publisher(),
  };
}

export function articleLd(post: {
  slug: string;
  title: string;
  excerpt: string;
  keyTakeaway: string | null;
  body: string;
  authorName: string;
  authorTitle: string | null;
  coverImageId: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  tags: string[];
  category: { name: string } | null;
  sources: { title: string; url: string }[];
}) {
  const cover = coverUrl(post.coverImageId);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: absolute(`/blog/${post.slug}`),
    headline: post.title,
    description: post.keyTakeaway ?? post.excerpt,
    abstract: post.excerpt,
    image: cover ? [absolute(cover)] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: "en-CA",
    author: { "@type": "Person", name: post.authorName, jobTitle: post.authorTitle ?? undefined },
    publisher: publisher(),
    articleSection: post.category?.name,
    keywords: post.tags.join(", ") || undefined,
    wordCount: post.body.split(/\s+/).filter(Boolean).length,
    citation: post.sources.length ? post.sources.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url })) : undefined,
  };
}

export function faqLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

/** Safe to drop into a script tag: closes no tags, opens no comments. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
