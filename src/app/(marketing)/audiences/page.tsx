import { Ambulance, Building2, Flame, GraduationCap, Hospital, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Accent, PageHero } from "@/components/marketing/page-hero";
import { PilotClose } from "@/components/marketing/pilot-close";
import { Container } from "@/components/marketing/section";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Who we serve",
  description: "Imedica is built for paramedic services first, and for fire departments, long-term care, paramedic colleges, hospital education teams and, soon, individual paramedics.",
  alternates: { canonical: "/audiences" },
};

const audiences = [
  {
    id: "ems",
    icon: Ambulance,
    name: "Paramedic services",
    tag: "Where we started",
    problem: "Crews meet the highest-stakes calls the least often, and recertification day can't rehearse them all.",
    help: "Ten-minute scenarios between calls, matched to your medical directives, and a readiness view by clinical area for your training lead.",
  },
  {
    id: "fire",
    icon: Flame,
    name: "Fire departments",
    tag: "Medical first response",
    problem: "Firefighters often arrive first to medical calls, with less time each year to practise them.",
    help: "Basic life support and first-response scenarios scored against the same physician-written rules, on a phone at the hall.",
  },
  {
    id: "ltc",
    icon: Building2,
    name: "Long-term care",
    tag: "Nursing homes",
    problem: "Staff face deteriorating residents and arrests between the scheduled drills, often on night shifts.",
    help: "Short recognition-and-response scenarios for nurses and personal support workers, with reporting that respects every staff member's privacy.",
  },
  {
    id: "colleges",
    icon: GraduationCap,
    name: "Paramedic programmes",
    tag: "Colleges",
    problem: "Students need far more decision repetitions than lab hours and placements can give them.",
    help: "Scenarios instructors can assign, consistent scoring across sections, and debriefs that teach the why, not just the what.",
  },
  {
    id: "hospitals",
    icon: Hospital,
    name: "Hospital education teams",
    tag: "Emergency departments",
    problem: "Emergency and critical-care staff rotate through rare presentations unevenly.",
    help: "Physician-authored cases for the first minutes of an emergency, with cohort reporting instead of individual league tables.",
  },
  {
    id: "individuals",
    icon: UserRound,
    name: "Individual paramedics",
    tag: "Coming 2027",
    problem: "Not every paramedic's service offers structured practice.",
    help: "An individual subscription is on the roadmap. Join the app launch list to hear when it opens.",
    soon: true,
  },
];

export default function AudiencesPage() {
  return (
    <>
      <PageHero
        chrome={["Who we serve", "Services · fire · long-term care · education"]}
        title={
          <>
            Built for the people <Accent>who respond first.</Accent>
          </>
        }
        lead="Imedica started with paramedic services in Ontario. The same idea, rare calls rehearsed often and scored the same way every time, works wherever people respond to emergencies."
        actions={
          <ul className="flex flex-wrap gap-2">
            {audiences.map((a) => (
              <li key={a.id}>
                <a href={`#${a.id}`} className="inline-flex h-10 items-center rounded-full border border-white/15 px-4 text-[14px] text-paper/80 hover:border-[#9ff0c4]/60 hover:text-paper">
                  {a.name}
                </a>
              </li>
            ))}
          </ul>
        }
        className="min-h-[76svh]"
      />

      <section className="py-24 md:py-32">
        <Container>
          <ul className="divide-y divide-rule border-y border-rule">
            {audiences.map(({ id, icon: Icon, name, tag, problem, help, soon }, i) => (
              <li key={id} id={id} className="grid scroll-mt-28 gap-6 py-12 md:grid-cols-[80px_minmax(0,1fr)_minmax(0,1.2fr)] md:gap-10 md:py-16">
                <p className="font-mono text-[13px] text-ink-3">{String(i + 1).padStart(2, "0")}</p>
                <div>
                  <Icon className={cn("size-7", soon ? "text-ink-3" : "text-pine-3")} aria-hidden />
                  <h2 className={cn("mt-4 font-display text-[clamp(2rem,3.4vw,2.8rem)] leading-none font-medium tracking-[-0.03em]", soon ? "text-ink-3" : "text-ink")}>
                    {name}
                  </h2>
                  <p className="mt-3 font-mono text-[11px] tracking-[0.14em] text-signal uppercase">{tag}</p>
                </div>
                <div className="space-y-4 text-[17px] leading-relaxed">
                  <p className="text-ink-3">{problem}</p>
                  <p className="text-ink">{help}</p>
                  {soon ? (
                    <Link href="/download" className="inline-block text-[15px] font-medium text-pine underline decoration-pine/30 underline-offset-[6px]">
                      Join the launch list →
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-[15px] text-ink-3">
            Pricing follows the size of your team, not the type of organization.{" "}
            <Link href="/pricing" className="text-pine underline decoration-pine/30 underline-offset-4">
              See pricing
            </Link>
            .
          </p>
        </Container>
      </section>

      <PilotClose />
    </>
  );
}
