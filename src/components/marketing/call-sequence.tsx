"use client";

import { Clock, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { OutcomeTag } from "@/components/ui/outcome-tag";
import { cn } from "@/lib/cn";

const stages = [
  {
    time: "00:00",
    name: "Dispatch",
    body: "The call arrives the way it would on the road: age, complaint, a worried caller. You walk in with the same thin picture.",
  },
  {
    time: "00:40",
    name: "Decide",
    body: "The monitor moves. The patient answers, or doesn't. The full action menu is open, wrong answers included, and the clock keeps running.",
  },
  {
    time: "09:15",
    name: "Debrief",
    body: "Every decision comes back tagged against the physician's rules, with the reason, the directive behind it, and what a stronger run looked like.",
  },
];

function Panel({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="rounded-2xl border border-rule bg-card p-6 shadow-[var(--shadow-float)]">
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-signal uppercase">
          <Radio className="size-3.5" /> Priority 4 · inbound
        </p>
        <p className="mt-4 font-display text-[1.7rem] leading-snug text-ink">
          “24-year-old woman, stung by a wasp at a park. Her friend says her lips are swelling and she can&apos;t breathe
          properly.”
        </p>
        <p className="mt-5 text-[14px] text-ink-3">Responding · ETA 6 minutes</p>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="overflow-hidden rounded-2xl bg-[#0b1714] text-paper shadow-[var(--shadow-float)]">
        <div className="grid grid-cols-4 border-b border-white/10 font-mono">
          {[
            ["HR", "128"],
            ["BP", "84/50"],
            ["SpO₂", "89"],
            ["RR", "30"],
          ].map(([k, v]) => (
            <div key={k} className="border-r border-white/10 px-4 py-3 last:border-0">
              <p className="text-[10px] tracking-wider text-paper/50 uppercase">{k}</p>
              <p className={cn("text-[1.6rem] leading-tight", k === "BP" || k === "SpO₂" ? "text-[#ff7b6f]" : "text-[#9ff0c4]")}>{v}</p>
            </div>
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-2 p-4">
          {["Epinephrine IM 0.5 mg", "Diphenhydramine 50 mg", "Salbutamol 5 mg neb", "Oxygen NRB 15 L/min"].map((a, i) => (
            <li
              key={a}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-[13px]",
                i === 0 ? "border-[#9ff0c4] bg-[#9ff0c4]/10 text-paper" : "border-white/10 text-paper/70",
              )}
            >
              {a}
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-2 border-t border-white/10 px-4 py-2.5 font-mono text-[11px] text-paper/55">
          <Clock className="size-3.5" /> 09:12 remaining
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-rule bg-card p-6 shadow-[var(--shadow-float)]">
      <div className="flex items-end justify-between border-b border-rule pb-4">
        <div>
          <p className="text-[13px] text-ink-3">Anaphylaxis after a wasp sting</p>
          <p className="font-display text-[1.5rem] text-ink">Proficient</p>
        </div>
        <p className="tabular font-display text-[3rem] leading-none text-ink">86%</p>
      </div>
      <ul className="divide-y divide-rule-2">
        {(
          [
            ["00:07", "Epinephrine IM", "CORRECT"],
            ["00:31", "Oxygen, NRB", "CORRECT"],
            ["01:10", "Diphenhydramine first", "SUBOPTIMAL"],
            ["05:20", "Repeat epinephrine IM", "CORRECT"],
          ] as const
        ).map(([t, a, o]) => (
          <li key={t} className="flex items-center gap-3 py-2.5 text-[14px]">
            <span className="tabular w-11 font-mono text-[12px] text-ink-3">{t}</span>
            <span className="flex-1 text-ink">{a}</span>
            <OutcomeTag outcome={o} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Sticky storytelling: the left column holds; the stages scroll past it. */
export function CallSequence() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
      <div className="lg:sticky lg:top-[18vh] lg:h-[64vh] lg:self-start">
        <p className="tabular font-mono text-[clamp(4rem,10vw,9rem)] leading-none font-medium tracking-[-0.04em] text-ink">
          {stages[active].time}
        </p>
        <div className="mt-6 flex gap-2" aria-hidden>
          {stages.map((s, i) => (
            <span
              key={s.name}
              className={cn("h-1 rounded-full transition-all duration-500", i === active ? "w-16 bg-signal" : "w-6 bg-rule")}
            />
          ))}
        </div>
        <div className="mt-8 hidden lg:block">
          <div key={active} className="motion-safe:animate-[verdict-in_520ms_var(--ease-out-expo)]">
            <Panel index={active} />
          </div>
        </div>
      </div>

      <ol>
        {stages.map((s, i) => (
          <li
            key={s.name}
            data-index={i}
            ref={(el) => {
              refs.current[i] = el as HTMLDivElement | null;
            }}
            className="flex min-h-[70vh] flex-col justify-center py-10 lg:min-h-[85vh]"
          >
            <p className="font-mono text-[12px] tracking-[0.14em] text-signal uppercase">
              {s.time} · {String(i + 1).padStart(2, "0")} / 03
            </p>
            <h3
              className={cn(
                "mt-3 font-display text-[clamp(2.6rem,5.4vw,4.8rem)] leading-[0.98] font-medium tracking-[-0.03em] transition-colors duration-500",
                i === active ? "text-ink" : "text-ink/25",
              )}
            >
              {s.name}
            </h3>
            <p className="mt-5 max-w-md text-[18px] leading-relaxed text-ink-2">{s.body}</p>
            <div className="mt-8 lg:hidden">
              <Panel index={i} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
