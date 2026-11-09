import "server-only";

import { env } from "../env";

export const BLOG_NAME = "Imedica Field Notes";

/** Share card used wherever a page has no image of its own (1200×630). */
export const DEFAULT_OG_IMAGE = { url: "/og/imedica-default.png", width: 1200, height: 630, alt: "Imedica: decision training for Canadian paramedics" };

/** One sentence, used verbatim wherever we describe the company to machines (JSON-LD, llms.txt). */
export const ENTITY_DESCRIPTION =
  "Imedica is decision-training software for Canadian paramedics, built by Ashavid Inc. in Ontario: short emergency scenarios scored against physician-written rules aligned to the Ontario ALS and BLS Patient Care Standards.";

export function absolute(path: string) {
  return new URL(path, env().APP_URL).toString();
}

export function coverUrl(coverImageId: string | null) {
  return coverImageId ? `/blog-media/${coverImageId}` : null;
}

// The entity helpers below read APP_URL directly, like the root layout's metadataBase, rather than
// through env(): the home page that uses them is prerendered at build, where the full server env
// may not validate.
const site = (path: string) => new URL(path, process.env.APP_URL ?? "http://localhost:3000").toString();
const ORG_ID = () => site("/#organization");

const publisher = () => ({
  "@type": "Organization",
  "@id": ORG_ID(),
  name: "Imedica",
  legalName: "Ashavid Inc.",
  url: site("/"),
  logo: { "@type": "ImageObject", url: site("/brand/imedica-app-icon.svg") },
});

/** Home page: who we are, so search and answer engines can anchor the brand to one entity. */
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    ...publisher(),
    description: ENTITY_DESCRIPTION,
    address: { "@type": "PostalAddress", addressLocality: "Newmarket", addressRegion: "ON", addressCountry: "CA" },
    areaServed: { "@type": "Country", name: "Canada" },
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": site("/#website"),
    name: "Imedica",
    url: site("/"),
    inLanguage: "en-CA",
    publisher: { "@id": ORG_ID() },
  };
}

/** A byline such as "Imedica Clinical Team" is an organisation, not a person. */
function authorLd(name: string, title: string | null) {
  return /\bteam\b/i.test(name)
    ? { "@type": "Organization", name, parentOrganization: { "@id": ORG_ID() } }
    : { "@type": "Person", name, jobTitle: title ?? undefined };
}

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
    image: [absolute(cover ?? DEFAULT_OG_IMAGE.url)],
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: "en-CA",
    author: authorLd(post.authorName, post.authorTitle),
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
