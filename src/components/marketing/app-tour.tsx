"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

export type TourStep = { shot: string; alt: string; time: string; title: string; body: string };

/** A phone in a thin dark bezel around a real app screenshot (1206×2622). */
export function PhoneShot({ src, alt, className, priority }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={cn("rounded-[2.6rem] border border-white/15 bg-[#030806] p-[7px] shadow-[0_50px_100px_-40px_rgb(0_0_0/0.85)]", className)}>
      <Image
        src={src}
        alt={alt}
        width={603}
        height={1311}
        priority={priority}
        sizes="(min-width: 1024px) 320px, 70vw"
        className="h-auto w-full rounded-[2.2rem]"
      />
    </div>
  );
}

/**
 * The call, step by step. On wide screens the phone stays pinned and its
 * screen changes as each step scrolls past; on phones every step carries
 * its own screenshot.
 */
export function AppTour({ steps }: { steps: TourStep[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-24">
      <ol>
        {steps.map((s, i) => (
          <li
            key={s.shot}
            data-step={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="flex min-h-[46svh] flex-col justify-center border-t border-ink/15 py-12 first:border-t-0 lg:min-h-[78svh]"
          >
            <p className={cn("font-mono text-[12px] tracking-[0.16em] uppercase transition-colors", active === i ? "text-pine-3" : "text-ink-3")}>
              <span className="tabular">{s.time}</span> · {String(i + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
            </p>
            <h3
              className={cn(
                "mt-4 max-w-[16ch] font-display text-[clamp(2.2rem,4.6vw,4.2rem)] leading-[0.98] font-medium tracking-[-0.035em] transition-colors duration-300",
                active === i ? "text-ink" : "text-ink lg:text-ink/30",
              )}
            >
              {s.title}
            </h3>
            <p className="mt-5 max-w-md text-[18px] leading-relaxed text-ink-2">{s.body}</p>
            <PhoneShot src={s.shot} alt={s.alt} className="mx-auto mt-10 w-[260px] lg:hidden" />
          </li>
        ))}
      </ol>

      <div className="hidden lg:block">
        <div className="sticky top-[calc(50svh-330px)]">
          <div className="relative mx-auto w-[300px]">
            <div className="absolute -inset-16 rounded-full bg-[radial-gradient(closest-side,rgb(43_122_92/0.22),transparent)]" aria-hidden />
            <div className="relative rounded-[2.6rem] border border-black/10 bg-[#030806] p-[7px] shadow-[0_60px_120px_-50px_rgb(6_17_14/0.7)]">
              <div className="relative aspect-[1206/2622] overflow-hidden rounded-[2.2rem] bg-[#0b1714]">
                {steps.map((s, i) => (
                  <Image
                    key={s.shot}
                    src={s.shot}
                    alt={i === active ? s.alt : ""}
                    aria-hidden={i !== active}
                    fill
                    sizes="300px"
                    className={cn(
                      "object-cover transition-[opacity,transform] duration-500 ease-out",
                      i === active ? "scale-100 opacity-100" : "scale-[1.03] opacity-0",
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-1.5" aria-hidden>
              {steps.map((s, i) => (
                <span key={s.shot} className={cn("h-1 rounded-full transition-all duration-300", i === active ? "w-8 bg-pine-3" : "w-3 bg-ink/15")} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
