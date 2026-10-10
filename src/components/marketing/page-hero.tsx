import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { DarkField } from "./dark-field";

/**
 * The dark opening every inner page shares with the homepage: monitor chrome
 * along the top, an oversized serif headline, and an optional instrument
 * beside it. Slides under the floating nav, which turns dark over it.
 */
export function PageHero({
  chrome,
  title,
  lead,
  actions,
  aside,
  backdrop,
  glow = "right",
  className,
  children,
}: {
  chrome: [string, string?];
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  /** Sits right of the headline on wide screens, below it on phones. */
  aside?: ReactNode;
  /** Full-bleed layer behind the text, e.g. a canvas. */
  backdrop?: ReactNode;
  glow?: "right" | "left" | "center";
  className?: string;
  /** Extra content under the lead and actions. */
  children?: ReactNode;
}) {
  return (
    <section
      data-nav="dark"
      className={cn("relative -mt-24 flex min-h-[86svh] flex-col overflow-hidden bg-[#06110e] text-paper md:-mt-28", className)}
    >
      {backdrop}
      <DarkField glow={glow} />

      <div className="relative z-10 mx-auto flex w-full max-w-[1320px] justify-between px-5 pt-28 font-mono text-[11px] tracking-[0.16em] text-paper/45 uppercase md:px-10 md:pt-32">
        <span>{chrome[0]}</span>
        {chrome[1] ? <span className="hidden md:block">{chrome[1]}</span> : null}
      </div>

      <div
        className={cn(
          "relative z-10 mx-auto grid w-full max-w-[1320px] flex-1 items-center gap-12 px-5 pt-12 pb-20 md:px-10 md:pb-28",
          aside ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10" : "",
        )}
      >
        <div>
          <h1 className="max-w-[13ch] font-display text-[clamp(3rem,7.6vw,7.6rem)] leading-[0.92] font-medium tracking-[-0.045em]">
            {title}
          </h1>
          {lead ? <p className="mt-8 max-w-xl text-[18px] leading-relaxed text-paper/72 md:mt-10 md:text-[19px]">{lead}</p> : null}
          {actions ? <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div> : null}
          {children}
        </div>
        {aside ? <div className="relative min-w-0">{aside}</div> : null}
      </div>
    </section>
  );
}

/** The mint accent used for the second half of every dark headline. */
export function Accent({ children }: { children: ReactNode }) {
  return <em className="font-normal text-[#9ff0c4]">{children}</em>;
}
