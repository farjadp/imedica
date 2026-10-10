import { Rss, Search } from "lucide-react";
import type { ReactNode } from "react";

import { DarkField } from "@/components/marketing/dark-field";

/** The blog's dark opening: smaller than a page hero, with search and RSS. */
export function BlogHero({ eyebrow, title, lead, q, crumbs }: { eyebrow: string; title: ReactNode; lead?: string; q?: string; crumbs?: ReactNode }) {
  return (
    <section data-nav="dark" className="relative -mt-24 overflow-hidden bg-[#06110e] text-paper md:-mt-28">
      <DarkField glow="right" />
      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-5 pt-28 pb-16 md:px-10 md:pt-36 md:pb-20">
        <div className="flex justify-between font-mono text-[11px] tracking-[0.16em] text-paper/45 uppercase">
          <span>{crumbs ?? eyebrow}</span>
          <a href="/blog/feed.xml" className="hidden items-center gap-1.5 hover:text-paper md:inline-flex">
            <Rss className="size-3.5" /> RSS
          </a>
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <h1 className="max-w-[16ch] font-display text-[clamp(2.8rem,6.4vw,6rem)] leading-[0.94] font-medium tracking-[-0.045em]">{title}</h1>
            {lead ? <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-paper/70">{lead}</p> : null}
          </div>
          <form action="/blog" role="search" className="relative">
            <label htmlFor="blog-q" className="sr-only">
              Search the blog
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-paper/50" aria-hidden />
            <input
              id="blog-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search anaphylaxis, STEMI, triage…"
              className="h-14 w-full rounded-full border border-white/15 bg-white/[0.06] pr-5 pl-12 text-[16px] text-paper placeholder:text-paper/40 focus:border-[#9ff0c4]/60 focus:outline-none"
            />
          </form>
        </div>
      </div>
    </section>
  );
}
