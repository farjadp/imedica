"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

import type { VaultTone } from "./privacy-vault";

const LABELS = [
  { key: "identity", title: "Identity", note: "names · emails · logins" },
  { key: "content", title: "Content", note: "scenarios · runs" },
  { key: "analytics", title: "Analytics", note: "no PII · to the week" },
  { key: "gate", title: "HMAC-SHA256", note: "the only way down" },
  { key: "withheld", title: "Withheld", note: "fewer than 5" },
] as const;

/**
 * The three Postgres schemas as an instrument: named records fall through the
 * hash gate and land on analytics as anonymous cubes, and a clinical area only
 * lights up once five people are in it. Labels are HTML pinned to the scene.
 * three.js loads after mount; paused off-screen; a still frame under reduced
 * motion.
 */
export function PrivacyLayers({ tone = "light", className }: { tone?: VaultTone; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const el = host.current!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let raf = 0;
    let visible = false;
    let last = performance.now();
    let cleanup = () => {};

    import("./privacy-vault")
      .then(({ createVault }) => {
        if (disposed) return;
        const vault = createVault(el, { tone, still });

        const draw = (dt: number) => {
          const at = vault.render(dt);
          for (const [key, pos] of Object.entries(at)) {
            const label = labels.current[key];
            if (label) label.style.transform = `translate3d(${(pos.x * el.clientWidth).toFixed(1)}px, ${(pos.y * el.clientHeight).toFixed(1)}px, 0)`;
          }
        };
        const tick = (now: number) => {
          if (!visible) return;
          draw(Math.min(0.05, (now - last) / 1000));
          last = now;
          raf = requestAnimationFrame(tick);
        };

        const io = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (still) {
            draw(0);
            return;
          }
          if (visible) {
            last = performance.now();
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(tick);
          }
        });
        io.observe(el);
        const ro = new ResizeObserver(() => draw(0));
        ro.observe(el);

        cleanup = () => {
          cancelAnimationFrame(raf);
          io.disconnect();
          ro.disconnect();
          vault.dispose();
        };
      })
      .catch((error) => console.error("[privacy] 3D view unavailable", error));

    return () => {
      disposed = true;
      visible = false;
      cleanup();
    };
  }, [tone]);

  const dark = tone === "dark";

  return (
    <figure className={cn("relative", className)}>
      <div className="relative aspect-[6/5] w-full">
        <div ref={host} className="absolute inset-0 [&>canvas]:h-full [&>canvas]:w-full" aria-hidden />
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {LABELS.map((l) => (
            <div
              key={l.key}
              ref={(node) => {
                labels.current[l.key] = node;
              }}
              className="absolute top-0 left-0 will-change-transform"
            >
              <div
                className={cn(
                  "font-mono text-[10px] leading-tight tracking-[0.14em] whitespace-nowrap uppercase",
                  l.key === "gate"
                    ? "-translate-x-1/2 -translate-y-full pb-1 text-center"
                    : l.key === "withheld"
                      ? "-translate-x-1/2 pt-2 text-center"
                      : "translate-x-1 translate-y-7",
                  dark ? "text-paper/55" : "text-ink-3",
                )}
              >
                <span
                  className={cn(
                    "block",
                    l.key === "identity" || l.key === "gate"
                      ? dark
                        ? "text-[#9ff0c4]"
                        : "text-pine"
                      : l.key === "analytics"
                        ? dark
                          ? "text-[#ffd27a]"
                          : "text-signal"
                        : dark
                          ? "text-paper/80"
                          : "text-ink-2",
                  )}
                >
                  {l.title}
                </span>
                <span className="hidden sm:block">{l.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="sr-only">
        Three separate database schemas. Named records can only reach analytics through a keyed one-way hash, and
        arrive there anonymous. Any group smaller than five people is withheld.
      </figcaption>
    </figure>
  );
}
