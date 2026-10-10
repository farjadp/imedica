"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

type Stage = { title: string; body: string; detail: string };

/**
 * A pinned index on the left whose numeral follows whichever stage is in the
 * middle of the screen, with the stages scrolling past on the right.
 */
export function StageScroller({ stages }: { stages: Stage[] }) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-24">
      <div className="hidden lg:block">
        <div className="sticky top-32">
          <p className="font-mono text-[12px] tracking-[0.14em] text-signal uppercase">
            Stage {active + 1} of {stages.length}
          </p>
          <div className="relative mt-4 h-[clamp(9rem,17vw,15rem)] overflow-hidden">
            {stages.map((s, i) => (
              <span
                key={s.title}
                aria-hidden
                className={cn(
                  "tabular absolute inset-0 font-display text-[clamp(9rem,17vw,15rem)] leading-[0.85] font-medium tracking-[-0.06em] text-ink transition-all duration-700 ease-[var(--ease-out-expo)]",
                  i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-full opacity-0" : "translate-y-full opacity-0",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            ))}
          </div>
          <ol className="mt-10 space-y-1 border-l border-rule">
            {stages.map((s, i) => (
              <li
                key={s.title}
                className={cn(
                  "-ml-px border-l-2 py-1.5 pl-5 text-[15px] transition-colors duration-500",
                  i === active ? "border-pine font-medium text-ink" : "border-transparent text-ink-3",
                )}
              >
                {s.title}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <ol>
        {stages.map((s, i) => (
          <li
            key={s.title}
            data-index={i}
            ref={(node) => {
              items.current[i] = node;
            }}
            className="flex min-h-[62vh] flex-col justify-center border-t border-rule py-14 first:border-t-0 lg:py-0"
          >
            <p className="font-mono text-[12px] tracking-[0.14em] text-signal uppercase lg:hidden">
              Stage {i + 1} of {stages.length}
            </p>
            <h3
              className={cn(
                "mt-3 font-display text-[clamp(2.2rem,4vw,3.6rem)] leading-[1] font-medium tracking-[-0.03em] text-ink transition-opacity duration-500 lg:mt-0",
                i === active ? "lg:opacity-100" : "lg:opacity-30",
              )}
            >
              {s.title}
            </h3>
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-ink-2">{s.body}</p>
            <p className="mt-6 max-w-xl border-l-2 border-pine-3 pl-4 text-[15px] leading-relaxed text-ink-3">{s.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
