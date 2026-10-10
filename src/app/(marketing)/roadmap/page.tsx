import { Check, Circle, CircleDot } from "lucide-react";
import type { Metadata } from "next";

import { Accent, PageHero } from "@/components/marketing/page-hero";
import { PilotClose } from "@/components/marketing/pilot-close";
import { Container } from "@/components/marketing/section";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "What Imedica has shipped, what we're building now, and where the platform goes next: mobile apps, pilots, certificates, new modules and provinces.",
  alternates: { canonical: "/roadmap" },
};

type Status = "done" | "now" | "next" | "later";

const phases: { status: Status; when: string; title: string; items: string[] }[] = [
  {
    status: "done",
    when: "2025 – October 2026",
    title: "Shipped",
    items: [
      "First iMedica BLS app on Android (2025)",
      "Platform rebuilt for paramedic decision training",
      "Physician scenario editor with a two-person publish rule",
      "Deterministic scoring engine and AI-written debriefs, with physician review",
      "Team readiness by clinical area, groups of five or more",
      "Identity, content and analytics split into separate schemas",
      "Audit log, invitations and seat management",
      "Field Notes, our clinical blog",
    ],
  },
  {
    status: "now",
    when: "Q4 2026",
    title: "Building now",
    items: [
      "iPhone and Android apps, launching October 20",
      "Ontario pilots with paramedic services",
      "Launch scenario library, reviewed by emergency physicians",
      "Pre- and post-assessments to measure a pilot's effect",
      "Production hosting in a Canadian region",
    ],
  },
  {
    status: "next",
    when: "First half of 2027",
    title: "Next",
    items: [
      "Verifiable completion certificates",
      "Offline mode for rural and remote crews",
      "Services authoring their own scenarios on the same rules",
      "Individual subscriptions for paramedics and students",
    ],
  },
  {
    status: "later",
    when: "2027 and beyond",
    title: "Later",
    items: [
      "ACLS, PALS and trauma modules",
      "Integration with dispatch and training records",
      "Predictive readiness: where a team is likely to struggle next",
      "Quebec, British Columbia, Alberta and the Prairies",
      "A version for US services under HIPAA",
    ],
  },
];

const style: Record<Status, { icon: typeof Check; dot: string; label: string }> = {
  done: { icon: Check, dot: "bg-pine text-paper", label: "Shipped" },
  now: { icon: CircleDot, dot: "bg-signal text-white", label: "In progress" },
  next: { icon: Circle, dot: "border-2 border-pine-3 bg-card text-pine-3", label: "Planned" },
  later: { icon: Circle, dot: "border-2 border-rule bg-card text-ink-3", label: "Exploring" },
};

export default function RoadmapPage() {
  return (
    <>
      <PageHero
        chrome={["Roadmap · updated October 2026", "Dates are targets, not promises"]}
        title={
          <>
            Where we are, <Accent>and where we&apos;re going.</Accent>
          </>
        }
        lead="Imedica started as a basic life support app. It's now a decision-training platform for paramedic services, and the next steps follow what pilots tell us."
        className="min-h-[72svh]"
      />

      <section className="py-24 md:py-32">
        <Container>
          <ol className="relative">
            <div className="absolute top-2 bottom-2 left-[15px] w-px bg-rule md:left-[calc(25%+15px)]" aria-hidden />
            {phases.map((p) => {
              const s = style[p.status];
              const Icon = s.icon;
              return (
                <li key={p.title} className="relative grid gap-6 pb-16 last:pb-0 md:grid-cols-[25%_1fr] md:gap-0">
                  <div className="pl-12 md:pr-10 md:pl-0 md:text-right">
                    <p className="font-mono text-[12px] tracking-[0.14em] text-signal uppercase">{p.when}</p>
                    <p className="mt-1 text-[13px] text-ink-3">{s.label}</p>
                  </div>
                  <span className={cn("absolute top-0 left-0 flex size-8 items-center justify-center rounded-full md:left-[25%]", s.dot)}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="pl-12 md:pl-16">
                    <h2 className="font-display text-[clamp(2rem,3.6vw,3rem)] leading-none font-medium tracking-[-0.03em] text-ink">{p.title}</h2>
                    <ul className={cn("mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2", p.status === "later" && "text-ink-3")}>
                      {p.items.map((i) => (
                        <li key={i} className="flex gap-3 border-t border-rule pt-3 text-[16px] text-ink-2">
                          {i}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-16 max-w-2xl border-t border-rule pt-6 text-[14px] leading-relaxed text-ink-3">
            This page describes intent, not a commitment. Priorities change with what pilot services need, clinical review
            and regulation. Want a say in what comes next? Run a pilot with us.
          </p>
        </Container>
      </section>

      <PilotClose />
    </>
  );
}
