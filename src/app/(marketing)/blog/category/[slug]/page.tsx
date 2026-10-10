import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { Accent } from "@/components/marketing/page-hero";
import { BlogHero } from "@/components/blog/blog-hero";
import { CategoryChips } from "@/components/blog/category-chips";
import { JsonLd } from "@/components/blog/json-ld";
import { Pager } from "@/components/blog/pager";
import { PostGrid } from "@/components/blog/post-grid";
import { Container } from "@/components/marketing/section";
import { breadcrumbLd, collectionLd } from "@/server/blog/seo";
import { getCategoriesWithCounts, getCategory, listLivePosts } from "@/server/blog/service";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const n = Number((await searchParams).page) || 1;
  const cat = await getCategory(slug);
  if (!cat) return { title: "Not found" };
  const description = cat.description ?? `Imedica Field Notes on ${cat.name.toLowerCase()}.`;
  const path = `/blog/category/${slug}`;
  return {
    title: n > 1 ? `${cat.name} — page ${n} · Field Notes` : `${cat.name} · Field Notes`,
    description,
    alternates: { canonical: n > 1 ? `${path}?page=${n}` : path },
    openGraph: { title: `${cat.name} · Imedica Field Notes`, description, url: path },
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  await connection();
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const cat = await getCategory(slug);
  if (!cat) notFound();
  const [{ posts, total, pages }, categories] = await Promise.all([listLivePosts({ categorySlug: slug, page }), getCategoriesWithCounts()]);
  const path = `/blog/category/${slug}`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: cat.name, path },
          ]),
          collectionLd(cat.name, cat.description ?? cat.name, path),
        ]}
      />
      <BlogHero
        eyebrow="Field notes"
        crumbs={
          <>
            <Link href="/blog" className="hover:text-paper">
              Field notes
            </Link>{" "}
            / {cat.name}
          </>
        }
        title={<Accent>{cat.name}</Accent>}
        lead={cat.description ?? undefined}
      />
      <section className="py-14 md:py-20">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <CategoryChips categories={categories} active={slug} />
            <p className="shrink-0 font-mono text-[12px] tracking-[0.12em] text-ink-3 uppercase">
              {total} article{total === 1 ? "" : "s"}
            </p>
          </div>
          <div className="mt-12">
            <PostGrid posts={posts} />
          </div>
          <Pager page={page} pages={pages} href={(p) => `${path}?page=${p}`} />
        </Container>
      </section>
    </>
  );
}
