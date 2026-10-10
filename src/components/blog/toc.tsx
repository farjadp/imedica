"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

type Item = { id: string; text: string; depth: 2 | 3 };

/** On this page: highlights the section being read. */
export function Toc({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return null;
  return (
    <nav aria-label="On this page">
      <p className="font-mono text-[11px] tracking-[0.14em] text-ink-3 uppercase">On this page</p>
      <ol className="mt-4 space-y-0.5 border-l border-rule">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className={cn(
                "-ml-px block border-l-2 py-1.5 text-[14px] leading-snug transition-colors",
                i.depth === 3 ? "pl-7" : "pl-4",
                active === i.id ? "border-pine font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink",
              )}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
