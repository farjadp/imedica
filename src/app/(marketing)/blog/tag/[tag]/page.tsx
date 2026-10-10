import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { Accent } from "@/components/marketing/page-hero";
import { BlogHero } from "@/components/blog/blog-hero";
import { JsonLd } from "@/components/blog/json-ld";
import { Pager } from "@/components/blog/pager";
import { PostGrid } from "@/components/blog/post-grid";
import { Container } from "@/components/marketing/section";
import { breadcrumbLd } from "@/server/blog/seo";
import { listLivePosts } from "@/server/blog/service";

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const tag = decodeURIComponent((await params).tag);
  // Tag pages are thin by nature: crawl them for links, keep them out of the index.
  return { title: `#${tag} · Field Notes`, robots: { index: false, follow: true }, alternates: { canonical: `/blog/tag/${encodeURIComponent(tag)}` } };
}

export default async function TagPage({ params, searchParams }: { params: Promise<{ tag: string }>; searchParams: Promise<{ page?: string }> }) {
  await connection();
  const tag = decodeURIComponent((await params).tag).toLowerCase();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { posts, total, pages } = await listLivePosts({ tag, page });
  if (!total) notFound();
  const path = `/blog/tag/${encodeURIComponent(tag)}`;

  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: `#${tag}`, path }])} />
      <BlogHero
        eyebrow="Field notes"
        crumbs={
          <>
            <Link href="/blog" className="hover:text-paper">
              Field notes
            </Link>{" "}
            / tag
          </>
        }
        title={<Accent>#{tag}</Accent>}
        lead={`${total} article${total === 1 ? "" : "s"} tagged ${tag}.`}
      />
      <section className="py-14 md:py-20">
        <Container>
          <PostGrid posts={posts} />
          <Pager page={page} pages={pages} href={(p) => `${path}?page=${p}`} />
        </Container>
      </section>
    </>
  );
}
