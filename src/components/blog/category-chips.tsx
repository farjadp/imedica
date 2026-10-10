import Link from "next/link";

import { cn } from "@/lib/cn";

export function CategoryChips({ categories, active }: { categories: { slug: string; name: string; count: number }[]; active?: string }) {
  const chip = (on: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] transition-colors",
      on ? "border-ink bg-ink text-paper" : "border-rule text-ink-2 hover:border-ink-3 hover:text-ink",
    );
  return (
    <nav aria-label="Categories" className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <ul className="flex gap-2 pb-1 md:flex-wrap">
        <li>
          <Link href="/blog" className={chip(!active)} aria-current={!active ? "page" : undefined}>
            All
          </Link>
        </li>
        {categories
          .filter((c) => c.count > 0 || c.slug === active)
          .map((c) => (
            <li key={c.slug}>
              <Link href={`/blog/category/${c.slug}`} className={chip(c.slug === active)} aria-current={c.slug === active ? "page" : undefined}>
                {c.name}
                <span className="tabular font-mono text-[11px] opacity-60">{c.count}</span>
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  );
}
