import type { Metadata } from "next";

import { Accent, PageHero } from "@/components/marketing/page-hero";
import { PilotClose } from "@/components/marketing/pilot-close";
import { ReadinessMonitor } from "@/components/marketing/readiness-monitor";
import { Container } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "For services",
  description: "What training directors at EMS, fire and hospital services get from Imedica, and how a pilot runs.",
};

const gets = [
  [
    "Readiness by clinical area",
    "Average performance across cardiac, respiratory, trauma, toxicology and the rest, so next quarter's training goes where the gap is.",
  ],
  [
    "Where decisions go wrong",
    "Which kinds of action most often come back harmful or late (medication, airway, transport), across the whole team.",
  ],
  [
    "Seats and invitations",
    "Invite paramedics by email, set roles, and deactivate accounts when people move on. Every change is logged.",
  ],
  [
    "Groups of five or more, always",
    "Any figure built from fewer than five people is withheld. That's enforced in the query, not left to good intentions.",
  ],
];

const pilot = [
  ["Weeks 1–2", "Set up", "Map your medical directives to the scenario library and set up your service's accounts."],
  ["Month 1", "Baseline", "A baseline set of scenarios for everyone in the pilot group."],
  ["Months 2–5", "Practice", "Regular practice, with a monthly review of team readiness with your training lead."],
  ["Month 6", "Measure", "A repeat of the baseline set, and a written before-and-after report."],
];

export default function ForServicesPage() {
  return (
    <>
      <PageHero
        chrome={["Team readiness · org-scoped", "Cohorts of 5 or more"]}
        title={
          <>
            See the team. <Accent>Never rank the people.</Accent>
          </>
        }
        lead="Training directors get a picture of their service by clinical area and over time. They never get a league table of their own people."
        aside={<ReadinessMonitor />}
        glow="right"
      />

      <section className="py-24 md:py-36">
        <Container>
          <h2 className="max-w-4xl font-display text-[clamp(2.4rem,5.2vw,4.8rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink">
            What a training director <em className="font-normal text-pine-3">gets.</em>
          </h2>
          <ul className="mt-16 grid gap-x-16 gap-y-14 md:grid-cols-2">
            {gets.map(([t, d], i) => (
              <li key={t} className="border-t border-ink pt-6">
                <p className="font-mono text-[12px] tracking-[0.14em] text-signal uppercase">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 font-display text-[clamp(1.8rem,2.8vw,2.4rem)] leading-[1.05] font-medium tracking-[-0.025em] text-ink">
                  {t}
                </h3>
                <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink-2">{d}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-y border-rule bg-card py-24 md:py-36">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-3xl font-display text-[clamp(2.4rem,5.2vw,4.8rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink">
              How a pilot <em className="font-normal text-pine-3">runs.</em>
            </h2>
            <p className="max-w-sm text-[17px] leading-relaxed text-ink-2">
              Six months with a group of your paramedics, at a reduced rate, with clear measures agreed up front.
            </p>
          </div>
          <div className="relative mt-16">
            <div className="absolute top-[9px] right-0 left-0 hidden h-px bg-rule md:block" aria-hidden />
            <ol className="relative grid gap-12 md:grid-cols-4 md:gap-8">
              {pilot.map(([when, name, what], i) => (
                <li key={when} className="relative">
                  <span
                    className={
                      i === pilot.length - 1
                        ? "relative block size-[19px] rounded-full bg-pine ring-4 ring-pine-wash"
                        : "relative block size-[19px] rounded-full border-2 border-pine bg-card"
                    }
                    aria-hidden
                  />
                  <p className="mt-6 font-mono text-[12px] tracking-[0.14em] text-signal uppercase">{when}</p>
                  <h3 className="mt-2 font-display text-[2rem] leading-tight font-medium tracking-[-0.02em] text-ink">
                    {name}
                  </h3>
                  <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{what}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <PilotClose
        title={
          <>
            Talk to us about <em className="font-normal text-[#9ff0c4]">a pilot.</em>
          </>
        }
      />
    </>
  );
}
