"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";

import { EcgTrace } from "@/components/clinical/ecg-trace";
import { OutcomeTag } from "@/components/ui/outcome-tag";
import type { Outcome } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";

type Choice = {
  id: string;
  label: string;
  detail: string;
  outcome: Outcome;
  rationale: string;
};

// A taste of a real scenario. Wording follows common Canadian ALS practice
// but is illustrative only.
const choices: Choice[] = [
  {
    id: "ecg",
    label: "Acquire 12-lead ECG",
    detail: "Assessment",
    outcome: "CORRECT",
    rationale:
      "First move. A 12-lead within ten minutes of contact confirms the STEMI and starts the clock on a direct-to-cath-lab bypass.",
  },
  {
    id: "asa",
    label: "ASA 162 mg, chewed",
    detail: "Medication",
    outcome: "CORRECT",
    rationale: "Suspected ACS, no allergy, no active bleed. Early ASA is the right call.",
  },
  {
    id: "nitro",
    label: "Nitroglycerin 0.4 mg SL",
    detail: "Medication",
    outcome: "HARMFUL",
    rationale:
      "Systolic is 94. Nitro is contraindicated under 100 mmHg, and in an inferior MI it can drop preload and crash the pressure.",
  },
  {
    id: "o2",
    label: "Oxygen 15 L/min, NRB",
    detail: "Breathing",
    outcome: "SUBOPTIMAL",
    rationale: "SpO₂ is 95%. Routine high-flow oxygen isn't indicated in ACS when saturation is normal.",
  },
];

export function HeroCall() {
  const [taken, setTaken] = useState<string[]>([]);
  const last = choices.find((c) => c.id === taken.at(-1));
  const harmed = taken.includes("nitro");

  return (
    <div className="overflow-hidden rounded-xl border border-rule bg-card shadow-[var(--shadow-float)]">
      <div className="flex items-center justify-between border-b border-rule bg-pine px-4 py-2.5 text-paper">
        <p className="font-mono text-[11px] tracking-wider uppercase">
          <span className="mr-2 inline-block size-1.5 translate-y-[-1px] rounded-full bg-signal motion-safe:animate-pulse" />
          Dispatch · Priority 4 · Chest pain
        </p>
        <p className="font-mono text-[11px] text-paper/70">On scene 03:12</p>
      </div>

      <div className="px-4 pt-4 pb-3 sm:px-5">
        <p className="text-[15px] leading-relaxed text-ink-2">
          58-year-old man, crushing chest pain for 40 minutes, pale and diaphoretic. Took nothing before you
          arrived.
        </p>
      </div>

      <dl className="grid grid-cols-4 border-y border-rule">
        {[
          ["HR", harmed ? "126" : "108", "bpm"],
          ["BP", harmed ? "71/40" : "94/60", "mmHg"],
          ["SpO₂", "95", "%"],
          ["RR", "22", "/min"],
        ].map(([k, v, u]) => (
          <div key={k} className="border-r border-rule px-3 py-2.5 last:border-r-0 sm:px-4">
            <dt className="font-mono text-[10px] tracking-wider text-ink-3 uppercase">{k}</dt>
            <dd
              className={cn(
                "tabular font-mono text-xl font-medium text-ink transition-colors sm:text-2xl",
                harmed && (k === "BP" || k === "HR") && "text-tag-red",
              )}
            >
              {v}
              <span className="ml-1 text-[10px] font-normal text-ink-3">{u}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="ecg-paper relative border-b border-rule">
        <EcgTrace rhythm={harmed ? "tachycardia" : "stemi"} height={76} />
        <p className="absolute right-3 bottom-1.5 font-mono text-[10px] text-ink-3">II · 25 mm/s</p>
      </div>

      <div className="p-4 sm:p-5">
        <p className="mb-2.5 text-[13px] font-medium text-ink-2">What do you do?</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {choices.map((c) => {
            const done = taken.includes(c.id);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={done}
                  onClick={() => setTaken((t) => [...t, c.id])}
                  className={cn(
                    "group flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition-[border-color,background-color] duration-150",
                    done ? "border-rule-2 bg-paper" : "border-rule bg-card hover:border-pine-3 hover:bg-pine-wash",
                  )}
                >
                  <span>
                    <span className={cn("block text-[14px] font-medium", done ? "text-ink-3" : "text-ink")}>
                      {c.label}
                    </span>
                    <span className="block font-mono text-[10px] tracking-wider text-ink-3 uppercase">{c.detail}</span>
                  </span>
                  {done ? <OutcomeTag outcome={c.outcome} /> : null}
                </button>
              </li>
            );
          })}
        </ul>

        <div aria-live="polite" className="mt-3 min-h-[92px]">
          {last ? (
            <div
              key={last.id}
              className={cn(
                "rounded-md border px-3.5 py-3 motion-safe:animate-[verdict-in_360ms_var(--ease-out-expo)]",
                last.outcome === "HARMFUL"
                  ? "border-tag-red/30 bg-tag-red-wash"
                  : last.outcome === "SUBOPTIMAL"
                    ? "border-tag-yellow/30 bg-tag-yellow-wash"
                    : "border-tag-green/30 bg-tag-green-wash",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <OutcomeTag outcome={last.outcome} />
                {taken.length === choices.length ? (
                  <button
                    type="button"
                    onClick={() => setTaken([])}
                    className="inline-flex items-center gap-1 text-[12px] text-ink-3 hover:text-ink"
                  >
                    <RotateCcw className="size-3" /> Run it again
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-ink">{last.rationale}</p>
            </div>
          ) : (
            <p className="pt-1 text-[13px] text-ink-3">
              Each choice is scored against the physician&apos;s rules the moment you make it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
