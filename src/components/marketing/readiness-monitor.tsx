"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

const rows = [
  { category: "Cardiac", pct: 84, people: 23 },
  { category: "Respiratory", pct: 77, people: 19 },
  { category: "Allergic", pct: 71, people: 14 },
  { category: "Toxicology", pct: 52, people: 9 },
  { category: "Paediatric", pct: 0, people: 3 },
];

/**
 * The training director's view, as it would sit on the station wall: team
 * readiness by clinical area, bars filling as it scrolls into view. Any area
 * with fewer than five people is withheld, as the real query does.
 */
export function ReadinessMonitor() {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setOn(true);
        io.disconnect();
      }
    }, { threshold: 0.35 });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  return (
    <figure
      ref={ref}
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1714]/80 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8)] backdrop-blur"
    >
      <figcaption className="flex items-center justify-between border-b border-white/10 px-5 py-4 font-mono text-[11px] tracking-[0.14em] text-paper/50 uppercase md:px-6">
        <span>Lakeshore EMS · last 90 days</span>
        <span>Sample data</span>
      </figcaption>
      <ul className="space-y-5 px-5 py-6 md:px-6 md:py-7">
        {rows.map((r, i) => {
          const withheld = r.people < 5;
          return (
            <li key={r.category}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[15px] text-paper">{r.category}</span>
                <span className="tabular font-mono text-[13px] text-paper/55">
                  {withheld ? "withheld · n < 5" : `${r.pct}% · n ${r.people}`}
                </span>
              </div>
              <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                {withheld ? (
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.10)_0_6px,transparent_6px_12px)]" />
                ) : (
                  <div
                    className={cn(
                      "h-full origin-left rounded-full transition-transform duration-[1400ms] ease-[var(--ease-out-expo)]",
                      r.pct < 60 ? "bg-[#ffd27a]" : "bg-[#9ff0c4]",
                    )}
                    style={{ width: `${r.pct}%`, transform: `scaleX(${on ? 1 : 0})`, transitionDelay: `${i * 110}ms` }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-white/10 px-5 py-4 text-[13px] leading-relaxed text-paper/55 md:px-6">
        Toxicology is below target, so next quarter&apos;s practice set leans that way. Paediatric has three people with
        completed runs, so it isn&apos;t shown.
      </p>
    </figure>
  );
}
