import type { Metadata } from "next";

import { EcgTrace } from "@/components/clinical/ecg-trace";
import { Container, SectionHeading } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";
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

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b border-rule">
        <Container className="py-16 md:py-24">
          <SectionHeading
            as="h1"
            title="From a physician's rules to a paramedic's debrief."
            lead="Imedica keeps judgement and explanation apart. People with clinical authority write the rules; software applies them the same way every time; an AI model explains the result."
          />
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <ol className="relative space-y-16 md:space-y-20">
            {stages.map((s, i) => (
              <li key={s.title} className="grid gap-6 md:grid-cols-[220px_1fr] md:gap-12">
                <div className="border-t border-ink pt-4">
                  <p className="font-mono text-[12px] text-signal">Stage {i + 1} of {stages.length}</p>
                </div>
                <div className="max-w-2xl">
                  <h2 className="font-display text-3xl font-medium tracking-[-0.015em] text-ink">{s.title}</h2>
                  <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{s.body}</p>
                  <p className="mt-4 text-[14px] text-ink-3">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-y border-rule bg-card">
        <Container className="grid gap-10 py-16 md:grid-cols-[1fr_1fr] md:py-24">
          <SectionHeading
            title="Five verdicts, coloured like triage tags."
            lead="Paramedics already read these colours without thinking. Outcomes use them so a debrief can be scanned in seconds."
          />
          <dl className="divide-y divide-rule-2 self-center">
            {(
              [
                ["CORRECT", "The right action at the right time."],
                ["ACCEPTABLE", "Defensible, but not the strongest choice."],
                ["SUBOPTIMAL", "Not indicated here, or the right action given too late."],
                ["HARMFUL", "Contraindicated. The patient gets worse."],
                ["CRITICAL", "Serious harm. The scenario ends."],
              ] as const
            ).map(([o, d]) => (
              <div key={o} className="flex items-center gap-4 py-3.5">
                <dt className="w-28 shrink-0">
                  <OutcomeTag outcome={o} />
                </dt>
                <dd className="text-[15px] text-ink-2">{d}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
          <div>
            <div className="ecg-paper mb-8 overflow-hidden rounded-md border border-rule">
              <EcgTrace rhythm="sinus" height={48} />
            </div>
            <h2 className="font-display text-3xl font-medium text-ink">See it with your own directives.</h2>
            <p className="mt-3 max-w-xl text-[17px] text-ink-2">
              We&apos;ll walk your training team through a live scenario and show how it maps to your service&apos;s
              protocols.
            </p>
          </div>
          <ButtonLink href="/demo" size="lg">
            Request a demo
          </ButtonLink>
        </Container>
      </section>
    </>
  );
}
