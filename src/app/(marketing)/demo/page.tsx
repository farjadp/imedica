import type { Metadata } from "next";

import { site } from "@/lib/site";
import { Accent, PageHero } from "@/components/marketing/page-hero";

import { DemoForm } from "./demo-form";

export const metadata: Metadata = {
  title: "Request a demo",
  description: "Book a walkthrough of Imedica with a member of the clinical team.",
};

const agenda = [
  ["00:00", "A live scenario, run start to finish"],
  ["10:00", "The debrief and the physician's rules behind it"],
  ["18:00", "The instructor view of team readiness"],
  ["24:00", "How a pilot would work for your service"],
];

export default function DemoPage() {
  return (
    <PageHero
      chrome={["Request · 30 minutes · with a physician", "Pilots open in Ontario · 2026"]}
      title={
        <>
          See a call run, <Accent>start to finish.</Accent>
        </>
      }
      lead="Thirty minutes with a physician from our team. For paramedic, fire and hospital services, colleges and long-term care."
      aside={<DemoForm />}
      className="min-h-[100svh]"
    >
      <ol className="mt-12 max-w-xl border-t border-white/10">
        {agenda.map(([t, what]) => (
          <li key={t} className="flex gap-6 border-b border-white/10 py-4">
            <span className="tabular w-14 shrink-0 font-mono text-[13px] text-[#9ff0c4]">{t}</span>
            <span className="text-[16px] text-paper/80">{what}</span>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-[14px] text-paper/50">Prefer email? Write to {site.contactEmail}.</p>
    </PageHero>
  );
}
