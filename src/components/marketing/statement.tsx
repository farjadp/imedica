"use client";

import { useEffect, useRef } from "react";

/**
 * Lines that light up as they cross the middle of the screen, then stay lit.
 * Scroll-linked, so it reads at the visitor's pace rather than on a timer.
 */
export function Statement({ lines }: { lines: { text: string; accent?: boolean }[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current!;
    const items = [...root.querySelectorAll<HTMLElement>("[data-line]")];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((el) => (el.style.opacity = "1"));
      return;
    }
    let raf = 0;
    const update = () => {
      const mid = window.innerHeight * 0.62;
      for (const el of items) {
        const r = el.getBoundingClientRect();
        const t = Math.min(1, Math.max(0, (mid - r.top) / (r.height * 1.4)));
        el.style.opacity = String(0.14 + t * 0.86);
        el.style.transform = `translateY(${(1 - t) * 14}px)`;
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className="space-y-1">
      {lines.map((l) => (
        <p
          key={l.text}
          data-line
          className={`font-display text-[clamp(2.4rem,6.6vw,6.4rem)] leading-[1.02] font-medium tracking-[-0.035em] will-change-transform ${
            l.accent ? "text-[#9ff0c4] italic" : "text-paper"
          }`}
          style={{ opacity: 0.14 }}
        >
          {l.text}
        </p>
      ))}
    </div>
  );
}
