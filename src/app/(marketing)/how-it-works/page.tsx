import type { Metadata } from "next";

import { EcgTrace } from "@/components/clinical/ecg-trace";
import { DarkField } from "@/components/marketing/dark-field";
import { Accent, PageHero } from "@/components/marketing/page-hero";
import { PilotClose } from "@/components/marketing/pilot-close";
import { Container } from "@/components/marketing/section";
import { StageScroller } from "@/components/marketing/stage-scroller";
import { OutcomeTag } from "@/components/ui/outcome-tag";

export const metadata: Metadata = {
  title: "How it works",
  description: "How physicians author Imedica scenarios, how paramedics run them, and how every decision is scored and explained.",
};

const stages = [
  {
    title: "A physician writes the call",
    body: "Each scenario is a sequence of moments: the scene, the patient, the vitals on the monitor. For every moment the physician lists what a paramedic might do and what each choice means: correct, acceptable, suboptimal, harmful, or critical. They add the reason, the directive it comes from, and how long the right action can wait.",
    detail: "Draft → review by a second physician → published. Every edit is on the audit log.",
  },
  {
    title: "A paramedic runs it",
    body: "The scenario opens with dispatch. Vitals change as the patient responds, the clock keeps running, and the action menu holds everything a crew can do on scene, not just the right answers. A harmful choice changes the patient. A critical one ends the call.",
    detail: "Works in a browser on a phone, tablet or station computer. Ten to fifteen minutes.",
  },
  {
    title: "The rules score it",
    body: "Scoring is deterministic. The same decision at the same moment earns the same verdict every time, and the right action taken too late is marked late. Required steps that never happened are listed in the debrief.",
    detail: "No model decides a score. The grade is reproducible and auditable.",
  },
  {
    title: "The debrief explains it",
    body: "Each decision comes back with its triage-coloured verdict and the physician's reason. Claude then writes a short explanation tying the run together: what went well, the decision that mattered most, and what to practise next. It sees the scenario and the decisions, never who made them.",
    detail: "Physicians can approve or flag any explanation from the review queue.",
  },
];

const verdicts = [
  ["CORRECT", "The right action at the right time."],
  ["ACCEPTABLE", "Defensible, but not the strongest choice."],
  ["SUBOPTIMAL", "Not indicated here, or the right action given too late."],
  ["HARMFUL", "Contraindicated. The patient gets worse."],
  ["CRITICAL", "Serious harm. The scenario ends."],
] as const;

/** One moment of a real scenario, written the way the physician editor stores it. */
function RuleCard() {
  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1714]/80 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8)] backdrop-blur">
      <figcaption className="flex items-center justify-between border-b border-white/10 px-5 py-4 font-mono text-[11px] tracking-[0.14em] text-paper/50 uppercase md:px-6">
        <span>Inferior STEMI · moment 3 of 6</span>
        <span className="text-[#9ff0c4]">Published</span>
      </figcaption>
      <div className="grid grid-cols-4 border-b border-white/10 font-mono">
        {[
          ["HR", "54"],
          ["BP", "96/60"],
          ["SpO₂", "95"],
          ["V4R", "ST↑"],
        ].map(([k, v]) => (
          <div key={k} className="border-r border-white/10 px-4 py-3 last:border-r-0 md:px-5">
            <p className="text-[10px] tracking-[0.14em] text-paper/45 uppercase">{k}</p>
            <p className="tabular mt-1 text-[1.35rem] text-paper">{v}</p>
          </div>
        ))}
      </div>
      <ul className="divide-y divide-white/8">
        {(
          [
            ["Fluid bolus 250 mL", "within 3:00", "CORRECT"],
            ["Fluid bolus 250 mL", "after 3:00", "SUBOPTIMAL"],
            ["Repeat 12-lead", "any time", "ACCEPTABLE"],
            ["Nitroglycerin 0.4 mg SL", "RV involvement", "HARMFUL"],
          ] as const
        ).map(([action, when, outcome]) => (
          <li key={action + when} className="flex items-center gap-4 px-5 py-3.5 md:px-6">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] text-paper">{action}</p>
              <p className="font-mono text-[11px] text-paper/45">{when}</p>
            </div>
            <OutcomeTag outcome={outcome} />
          </li>
        ))}
      </ul>
      <p className="border-t border-white/10 px-5 py-4 text-[13px] leading-relaxed text-paper/55 md:px-6">
        <span className="text-paper/85">Reason.</span> The right ventricle depends on preload. Nitrates drop it, and the
        pressure with it.
      </p>
    </figure>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        chrome={["Scenario engine · rules v3", "Deterministic · reproducible"]}
        title={
          <>
            Rules first. <Accent>Then the reason.</Accent>
          </>
        }
        lead="Imedica keeps judgement and explanation apart. People with clinical authority write the rules, software applies them the same way every time, and an AI model explains the result."
        aside={<RuleCard />}
        backdrop={
          <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-40" aria-hidden>
            <EcgTrace rhythm="sinus" height={90} stroke="rgb(159 240 196 / 0.45)" />
          </div>
        }
      />

      <section className="py-24 md:py-32">
        <Container>
          <h2 className="max-w-4xl font-display text-[clamp(2.4rem,5.2vw,4.8rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink">
            Four stages, <em className="font-normal text-pine-3">two kinds of authority.</em>
          </h2>
          <div className="mt-10 lg:mt-4">
            <StageScroller stages={stages} />
          </div>
        </Container>
      </section>

      <section data-nav="dark" className="relative overflow-hidden bg-[#06110e] py-28 text-paper md:py-40">
        <DarkField glow="left" />
        <Container className="relative grid gap-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-24">
          <div>
            <h2 className="font-display text-[clamp(2.6rem,5.6vw,5.2rem)] leading-[0.95] font-medium tracking-[-0.035em]">
              Five verdicts, <Accent>coloured like triage tags.</Accent>
            </h2>
            <p className="mt-7 max-w-md text-[18px] leading-relaxed text-paper/65">
              Paramedics already read these colours without thinking, so a debrief can be scanned in seconds.
            </p>
          </div>
          <dl className="divide-y divide-white/10 border-y border-white/10">
            {verdicts.map(([o, d]) => (
              <div key={o} className="grid items-center gap-3 py-6 sm:grid-cols-[150px_1fr] sm:gap-8">
                <dt>
                  <OutcomeTag outcome={o} className="h-7 px-2.5 text-[12px]" />
                </dt>
                <dd className="font-display text-[clamp(1.4rem,2.2vw,1.9rem)] leading-snug text-paper/90">{d}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <PilotClose
        title={
          <>
            See it with <em className="font-normal text-[#9ff0c4]">your own directives.</em>
          </>
        }
        body="We'll walk your training team through a live scenario and show how it maps to your service's protocols."
      />
    </>
  );
}
