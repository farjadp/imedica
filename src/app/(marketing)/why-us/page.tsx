import { Check, Minus, X } from "lucide-react";
import type { Metadata } from "next";

import { DarkField } from "@/components/marketing/dark-field";
import { Accent, PageHero } from "@/components/marketing/page-hero";
import { PilotClose } from "@/components/marketing/pilot-close";
import { Container } from "@/components/marketing/section";
import { Statement } from "@/components/marketing/statement";

export const metadata: Metadata = {
  title: "Why Imedica",
  description: "How Imedica compares with mannequin simulation, VR and e-learning for training paramedic decisions, and why services choose it.",
  alternates: { canonical: "/why-us" },
};

type Mark = "yes" | "part" | "no";
const cols = ["Mannequin labs", "VR simulation", "E-learning modules", "Imedica"];
const rows: [string, Mark[]][] = [
  ["Trains hands-on skills", ["yes", "part", "no", "no"]],
  ["Trains time-critical decisions", ["part", "yes", "no", "yes"]],
  ["Practice between calls, on a phone", ["no", "no", "yes", "yes"]],
  ["No special hardware or room", ["no", "no", "yes", "yes"]],
  ["Same decision, same score, every time", ["no", "part", "part", "yes"]],
  ["Physician-written rules, with reasons", ["part", "part", "part", "yes"]],
  ["Team readiness without ranking people", ["no", "no", "no", "yes"]],
  ["Privacy split built into the data model", ["no", "no", "no", "yes"]],
];

const icon = { yes: Check, part: Minus, no: X } as const;
const tone = { yes: "text-tag-green", part: "text-tag-yellow", no: "text-ink-3/50" } as const;
const words = { yes: "Yes", part: "Partly", no: "No" } as const;

const reasons = [
  ["Built by clinicians", "An anesthesiologist, an emergency physician and a clinician-operator founded Imedica. Physicians write and review every scenario."],
  ["Decisions, not just drills", "Mannequins teach hands. We train the judgement that decides what the hands do first, which is where harm happens."],
  ["Rare calls, often", "Paediatric arrests and anaphylaxis at a school are rare on the road. Here they can happen every week."],
  ["Explainable by design", "Rules decide the score and an AI model explains it. No black box grades a paramedic."],
  ["Privacy as architecture", "Names and scores never share a table. Reporting only shows groups of five or more."],
  ["Priced for public budgets", "No hardware, no per-unit simulators: an annual plan priced by team size."],
];

export default function WhyUsPage() {
  return (
    <>
      <PageHero
        chrome={["Why Imedica", "Mannequins · VR · e-learning · decisions"]}
        title={
          <>
            Hands are trained. <Accent>Judgement isn&apos;t.</Accent>
          </>
        }
        lead="Every service already has mannequins and online modules. Imedica fills the gap between them: frequent, scored practice of the decisions that matter most on rare calls."
        className="min-h-[76svh]"
      />

      <section className="py-24 md:py-32">
        <Container>
          <h2 className="max-w-3xl font-display text-[clamp(2.4rem,5.2vw,4.8rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink">
            Where it fits <em className="font-normal text-pine-3">in your training.</em>
          </h2>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-2">
            Imedica doesn&apos;t replace skills labs. It adds what they can&apos;t do: practice that happens often enough to keep rare decisions sharp.
          </p>
          <div className="mt-14 overflow-x-auto rounded-2xl border border-rule bg-card">
            <table className="w-full min-w-[720px] text-left text-[15px]">
              <thead>
                <tr className="border-b border-rule">
                  <th className="px-5 py-4 font-normal text-ink-3" />
                  {cols.map((c, i) => (
                    <th key={c} className={`px-5 py-4 text-center text-[14px] font-medium ${i === 3 ? "bg-pine text-paper" : "text-ink"}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-rule-2">
                {rows.map(([label, marks]) => (
                  <tr key={label}>
                    <th scope="row" className="px-5 py-4 font-normal text-ink-2">
                      {label}
                    </th>
                    {marks.map((m, i) => {
                      const Icon = icon[m];
                      return (
                        <td key={i} className={`px-5 py-4 text-center ${i === 3 ? "bg-pine-wash/60" : ""}`}>
                          <Icon className={`mx-auto size-5 ${tone[m]}`} aria-label={words[m]} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[13px] text-ink-3">A general comparison of approaches, not of any particular product.</p>
        </Container>
      </section>

      <section data-nav="dark" className="relative overflow-hidden bg-[#06110e] py-28 text-paper md:py-40">
        <DarkField glow="center" />
        <Container className="relative">
          <Statement lines={[{ text: "Skills labs train hands." }, { text: "Modules train knowledge." }, { text: "Imedica trains the call.", accent: true }]} />
        </Container>
      </section>

      <section className="py-24 md:py-32">
        <Container>
          <h2 className="max-w-3xl font-display text-[clamp(2.4rem,5.2vw,4.8rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink">
            Six reasons <em className="font-normal text-pine-3">services choose us.</em>
          </h2>
          <ul className="mt-16 grid gap-x-12 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {reasons.map(([t, d], i) => (
              <li key={t} className="border-t border-ink pt-6">
                <p className="font-mono text-[12px] tracking-[0.14em] text-signal uppercase">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 font-display text-[1.7rem] leading-tight font-medium tracking-[-0.02em] text-ink">{t}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{d}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <PilotClose />
    </>
  );
}
