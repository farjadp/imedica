import { Activity, BookOpenCheck, Cpu, FileLock2, Gauge, LayoutDashboard, PenLine, Smartphone, Sparkles, Stethoscope, Users } from "lucide-react";
import type { Metadata } from "next";

import { Accent, PageHero } from "@/components/marketing/page-hero";
import { PilotClose } from "@/components/marketing/pilot-close";
import { Container } from "@/components/marketing/section";
import { DarkField } from "@/components/marketing/dark-field";

export const metadata: Metadata = {
  title: "The product",
  description: "Imedica is a decision-training platform for paramedics: physician-written scenarios, rule-based scoring, AI-written debriefs and privacy-first team reporting.",
  alternates: { canonical: "/product" },
};

const surfaces = [
  {
    icon: Activity,
    who: "For paramedics",
    title: "The training area",
    body: "A library of emergencies to run in ten minutes, a focused call screen with a live monitor and a running clock, instant verdicts, and a debrief that explains every decision.",
    points: ["Scenario library by clinical area", "Full-screen call runtime", "Debrief with reasons and missed steps", "Run history and progress"],
  },
  {
    icon: PenLine,
    who: "For physicians",
    title: "The scenario editor",
    body: "Physicians build each call as a sequence of moments, set what every action means at each one, and publish only after a second physician signs off.",
    points: ["States with vitals and a monitor", "Rules per action and moment", "Teaching notes and directive sources", "Draft → review → publish, two-person rule"],
  },
  {
    icon: LayoutDashboard,
    who: "For training leads",
    title: "Team readiness",
    body: "A view of the service by clinical area and over time, built only from groups of five or more, with seats, invitations and an audit trail.",
    points: ["Readiness by clinical area", "Where decisions go wrong", "Invitations and seat limits", "Audit log of every change"],
  },
];

const engine = [
  { icon: Gauge, title: "Deterministic scoring", body: "Physician-written rules decide every verdict. Same decision, same moment, same score." },
  { icon: Sparkles, title: "Explained by Claude", body: "An AI model writes the debrief in plain language. It never sees who you are and can't change a score." },
  { icon: Stethoscope, title: "Physician review", body: "Physicians can approve or flag any AI explanation from a review queue." },
  { icon: FileLock2, title: "Privacy by design", body: "Identity, content and analytics live in separate database schemas, joined only by a keyed hash." },
  { icon: Smartphone, title: "Web and mobile", body: "Runs in any browser, and in the iPhone and Android apps through the same API." },
  { icon: Cpu, title: "Accessible", body: "Built to WCAG 2.1 AA: keyboard, screen readers and reduced motion all work." },
];

export default function ProductPage() {
  return (
    <>
      <PageHero
        chrome={["The product · three surfaces, one record", "Rules decide · Claude explains"]}
        title={
          <>
            A simulator for <Accent>the decisions.</Accent>
          </>
        }
        lead="Mannequins train hands. Imedica trains the judgement around them: what to do first, what to hold, and when. Physicians write the calls, paramedics run them between shifts, and services see where the team is ready."
        actions={
          <div className="flex flex-wrap gap-6 font-mono text-[12px] tracking-[0.12em] text-paper/55 uppercase">
            <span className="flex items-center gap-2">
              <Users className="size-4 text-[#9ff0c4]" /> Paramedics
            </span>
            <span className="flex items-center gap-2">
              <BookOpenCheck className="size-4 text-[#9ff0c4]" /> Physicians
            </span>
            <span className="flex items-center gap-2">
              <LayoutDashboard className="size-4 text-[#9ff0c4]" /> Training leads
            </span>
          </div>
        }
      />

      <section className="py-24 md:py-32">
        <Container>
          <h2 className="max-w-3xl font-display text-[clamp(2.4rem,5.2vw,4.8rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink">
            Three surfaces, <em className="font-normal text-pine-3">one record.</em>
          </h2>
          <ul className="mt-16 grid gap-5 lg:grid-cols-3">
            {surfaces.map(({ icon: Icon, who, title, body, points }) => (
              <li key={title} className="flex flex-col rounded-2xl border border-rule bg-card p-7 md:p-8">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] tracking-[0.14em] text-signal uppercase">{who}</p>
                  <Icon className="size-5 text-pine-3" aria-hidden />
                </div>
                <h3 className="mt-5 font-display text-[2rem] leading-tight font-medium tracking-[-0.02em] text-ink">{title}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{body}</p>
                <ul className="mt-6 space-y-2 border-t border-rule pt-5 text-[14px] text-ink-2">
                  {points.map((p) => (
                    <li key={p} className="flex gap-2.5">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-pine-3" aria-hidden /> {p}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section data-nav="dark" className="relative overflow-hidden bg-[#06110e] py-24 text-paper md:py-32">
        <DarkField glow="left" />
        <Container className="relative">
          <h2 className="max-w-3xl font-display text-[clamp(2.4rem,5.2vw,4.8rem)] leading-[0.96] font-medium tracking-[-0.035em]">
            Under the hood, <Accent>on purpose.</Accent>
          </h2>
          <ul className="mt-16 grid gap-x-12 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {engine.map(({ icon: Icon, title, body }) => (
              <li key={title} className="border-t border-white/15 pt-6">
                <Icon className="size-6 text-[#9ff0c4]" aria-hidden />
                <h3 className="mt-4 font-display text-[1.6rem] leading-tight">{title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-paper/65">{body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <PilotClose />
    </>
  );
}
