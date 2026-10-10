import type { Metadata } from "next";
import { connection } from "next/server";

import { Accent } from "@/components/marketing/page-hero";
import { BlogHero } from "@/components/blog/blog-hero";
import { CategoryChips } from "@/components/blog/category-chips";
import { JsonLd } from "@/components/blog/json-ld";
import { Pager } from "@/components/blog/pager";
import { PostGrid } from "@/components/blog/post-grid";
import { Container } from "@/components/marketing/section";
import { BLOG_NAME, breadcrumbLd, collectionLd } from "@/server/blog/seo";
import { getCategoriesWithCounts, listLivePosts } from "@/server/blog/service";

const description =
  "Clinical decision-making for paramedics and EMS training leads: case breakdowns, protocol notes and what the data says, written with emergency physicians.";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }): Promise<Metadata> {
  const { page, q } = await searchParams;
  const n = Number(page) || 1;
  return {
    title: n > 1 ? `Field Notes — page ${n}` : "Field Notes",
    description,
    alternates: { canonical: n > 1 ? `/blog?page=${n}` : "/blog", types: { "application/rss+xml": "/blog/feed.xml" } },
    robots: q ? { index: false, follow: true } : undefined,
    openGraph: { title: BLOG_NAME, description, url: "/blog", type: "website" },
  };
}

export default async function BlogIndex({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  await connection();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const [{ posts, total, pages }, categories] = await Promise.all([listLivePosts({ page, q: q || undefined }), getCategoriesWithCounts()]);

  return (
    <>
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]), collectionLd(BLOG_NAME, description, "/blog")]} />
      <BlogHero
        eyebrow="Imedica · Field notes"
        title={
          <>
            Field notes from <Accent>the hard calls.</Accent>
          </>
        }
        lead={description}
        q={q}
      />
      <section className="py-14 md:py-20">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <CategoryChips categories={categories} />
            <p className="shrink-0 font-mono text-[12px] tracking-[0.12em] text-ink-3 uppercase">
              {q ? `${total} result${total === 1 ? "" : "s"} for “${q}”` : `${total} article${total === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="mt-12">
            <PostGrid posts={posts} featureFirst={page === 1 && !q} />
          </div>
          <Pager page={page} pages={pages} href={(p) => `/blog?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`} />
        </Container>
      </section>
    </>
  );
}
