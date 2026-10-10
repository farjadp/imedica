import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { Article } from "@/components/blog/article";
import { JsonLd } from "@/components/blog/json-ld";
import { PostCard } from "@/components/blog/post-card";
import { PilotClose } from "@/components/marketing/pilot-close";
import { Container } from "@/components/marketing/section";
import { asFaq, asSources } from "@/lib/blog";
import { absolute, articleLd, breadcrumbLd, coverUrl, faqLd } from "@/server/blog/seo";
import { getLivePost, getRelatedPosts } from "@/server/blog/service";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const post = await getLivePost((await params).slug);
  if (!post) return { title: "Not found" };
  const title = post.metaTitle ?? post.title;
  const description = post.metaDescription ?? post.excerpt;
  const cover = coverUrl(post.coverImageId);
  return {
    title: { absolute: post.metaTitle ? post.metaTitle : `${post.title} · Imedica` },
    description,
    keywords: [post.focusKeyword, ...post.tags].filter((k): k is string => !!k),
    authors: [{ name: post.authorName }],
    alternates: { canonical: post.canonicalUrl ?? `/blog/${post.slug}` },
    robots: post.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.authorName],
      section: post.category?.name,
      tags: post.tags,
      images: cover ? [{ url: cover, alt: post.coverAlt ?? post.title }] : undefined,
    },
    twitter: { card: cover ? "summary_large_image" : "summary", title, description, images: cover ? [cover] : undefined },
  };
}

export default async function PostPage({ params }: Props) {
  await connection();
  const post = await getLivePost((await params).slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post);
  const faq = asFaq(post.faq);
  const path = `/blog/${post.slug}`;

  return (
    <>
      <JsonLd
        data={[
          articleLd({ ...post, sources: asSources(post.sources) }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            ...(post.category ? [{ name: post.category.name, path: `/blog/category/${post.category.slug}` }] : []),
            { name: post.title, path },
          ]),
          ...(faq.length ? [faqLd(faq)] : []),
        ]}
      />
      <Article post={post} url={absolute(path)} />

      {related.length ? (
        <section className="border-t border-rule bg-card py-20 md:py-28">
          <Container>
            <h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] leading-none font-medium tracking-[-0.035em] text-ink">
              Keep <em className="font-normal text-pine-3">reading.</em>
            </h2>
            <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <PilotClose
        title={
          <>
            Practise the call <em className="font-normal text-[#9ff0c4]">before it&apos;s real.</em>
          </>
        }
        body="Imedica turns cases like this one into ten-minute scenarios your paramedics run between calls, scored against physician-written rules."
      />
    </>
  );
}
