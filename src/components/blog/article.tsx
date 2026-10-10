import { ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";

import { DarkField } from "@/components/marketing/dark-field";
import { cn } from "@/lib/cn";
import { Container } from "@/components/marketing/section";
import { asFaq, asSources, formatPostDate } from "@/lib/blog";
import { renderMarkdown } from "@/server/blog/markdown";

import { Cover } from "./post-card";
import { Share } from "./share";
import { Toc } from "./toc";

export type ArticlePost = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  keyTakeaway: string | null;
  faq: unknown;
  sources: unknown;
  tags: string[];
  coverImageId: string | null;
  coverAlt: string | null;
  authorName: string;
  authorTitle: string | null;
  readingMinutes: number;
  publishedAt: Date | null;
  updatedAt: Date;
  category: { slug: string; name: string } | null;
};

/** The post itself: dark masthead, cover, body with a pinned contents rail. */
export function Article({ post, url, banner }: { post: ArticlePost; url: string; banner?: React.ReactNode }) {
  const { html, toc } = renderMarkdown(post.body);
  const faq = asFaq(post.faq);
  const sources = asSources(post.sources);
  const updated = post.publishedAt && post.updatedAt.getTime() - post.publishedAt.getTime() > 864e5;

  return (
    <article>
      <header data-nav="dark" className="relative -mt-24 overflow-hidden bg-[#06110e] text-paper md:-mt-28">
        <DarkField glow="right" />
        <div
          className={cn(
            "relative z-10 mx-auto w-full max-w-[1100px] px-5 pt-28 md:px-10 md:pt-36",
            post.coverImageId ? "pb-40 md:pb-56" : "pb-16 md:pb-20",
          )}
        >
          {banner}
          <nav aria-label="Breadcrumb" className="font-mono text-[11px] tracking-[0.16em] text-paper/50 uppercase">
            <Link href="/blog" className="hover:text-paper">
              Field notes
            </Link>
            {post.category ? (
              <>
                <span className="mx-2">/</span>
                <Link href={`/blog/category/${post.category.slug}`} className="text-[#9ff0c4] hover:text-paper">
                  {post.category.name}
                </Link>
              </>
            ) : null}
          </nav>
          <h1 className="mt-8 max-w-[22ch] font-display text-[clamp(2.4rem,5.4vw,4.8rem)] leading-[0.98] font-medium tracking-[-0.04em]">
            {post.title}
          </h1>
          <p className="mt-6 max-w-2xl text-[19px] leading-relaxed text-paper/72">{post.excerpt}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-paper/60">
            <span className="text-paper/90">
              {post.authorName}
              {post.authorTitle ? <span className="text-paper/50"> · {post.authorTitle}</span> : null}
            </span>
            {post.publishedAt ? <time dateTime={post.publishedAt.toISOString()}>{formatPostDate(post.publishedAt)}</time> : <span>Not published</span>}
            <span>{post.readingMinutes} min read</span>
            {updated ? <span>Updated {formatPostDate(post.updatedAt)}</span> : null}
          </div>
        </div>
      </header>

      {post.coverImageId ? (
        <Container className="relative z-10 -mt-28 md:-mt-40">
          <Cover post={post} sizes="(min-width: 1200px) 1100px, 100vw" priority className="mx-auto aspect-[16/9] max-w-[1100px] rounded-2xl shadow-[var(--shadow-float)]" />
        </Container>
      ) : null}

      <Container className="py-14 md:py-20">
        <div className="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16">
          <div className="min-w-0">
            {toc.length > 1 ? (
              <details className="group mb-10 rounded-xl border border-rule bg-card lg:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[15px] font-medium text-ink">
                  On this page <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <ol className="space-y-2 px-5 pb-5 text-[15px]">
                  {toc.map((t) => (
                    <li key={t.id} className={t.depth === 3 ? "pl-4" : ""}>
                      <a href={`#${t.id}`} className="text-ink-2 hover:text-ink">
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}

            {post.keyTakeaway ? (
              <aside className="mb-12 rounded-2xl border-l-4 border-pine bg-pine-wash p-6 md:p-8" aria-label="Short answer">
                <p className="font-mono text-[11px] tracking-[0.14em] text-pine uppercase">The short answer</p>
                <p className="mt-3 font-display text-[1.35rem] leading-snug text-ink">{post.keyTakeaway}</p>
              </aside>
            ) : null}

            <div className="prose-blog" dangerouslySetInnerHTML={{ __html: html }} />

            {faq.length ? (
              <section className="mt-16" aria-labelledby="faq">
                <h2 id="faq" className="font-display text-[clamp(1.7rem,2.6vw,2.1rem)] font-medium tracking-[-0.02em] text-ink">
                  Frequently asked
                </h2>
                <div className="mt-6 divide-y divide-rule border-y border-rule">
                  {faq.map((f) => (
                    <details key={f.q} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[17px] font-medium text-ink">
                        {f.q}
                        <ChevronDown className="mt-1 size-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            {post.tags.length ? (
              <ul className="mt-14 flex flex-wrap gap-2" aria-label="Tags">
                {post.tags.map((t) => (
                  <li key={t}>
                    <Link href={`/blog/tag/${encodeURIComponent(t)}`} className="inline-flex h-8 items-center rounded-full bg-paper-2 px-3.5 text-[13px] text-ink-2 hover:bg-rule-2 hover:text-ink">
                      #{t}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            {sources.length ? (
              <section className="mt-12 rounded-2xl border border-rule bg-card p-6 md:p-8" aria-labelledby="sources">
                <h2 id="sources" className="font-mono text-[11px] tracking-[0.14em] text-ink-3 uppercase">
                  Sources
                </h2>
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] marker:text-ink-3">
                  {sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-start gap-1.5 text-pine underline decoration-pine/30 underline-offset-4 hover:decoration-pine">
                        {s.title} <ExternalLink className="mt-1 size-3 shrink-0" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <p className="mt-12 border-t border-rule pt-6 text-[13px] leading-relaxed text-ink-3">
              Educational content for trained clinicians. It doesn&apos;t replace your service&apos;s medical directives or
              your medical director&apos;s guidance.
            </p>

            <div className="mt-10 lg:hidden">
              <Share url={url} title={post.title} />
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-10">
              <Toc items={toc} />
              <Share url={url} title={post.title} />
            </div>
          </aside>
        </div>
      </Container>
    </article>
  );
}
