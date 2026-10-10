import type { Metadata } from "next";

import { Container, SectionHeading } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For services",
  description: "What training directors at EMS, fire and hospital services get from Imedica, and how a pilot runs.",
};

const readiness = [
  { category: "Cardiac", pct: 84 },
  { category: "Respiratory", pct: 77 },
  { category: "Allergic", pct: 71 },
  { category: "Toxicology", pct: 52 },
  { category: "Paediatric", pct: 0, suppressed: true },
];

export default function ForServicesPage() {
  return (
    <>
      <section className="border-b border-rule">
        <Container className="py-16 md:py-24">
          <SectionHeading
            as="h1"
            title="See where your team is ready, and where it isn't yet."
            lead="Training directors get a picture of their service by clinical area and over time. They never get a league table of their own people."
          />
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container className="grid items-start gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div className="space-y-10">
            {[
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
            ].map(([t, d]) => (
              <div key={t}>
                <h2 className="text-xl font-medium text-ink">{t}</h2>
                <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{d}</p>
              </div>
            ))}
          </div>

          <figure className="rounded-xl border border-rule bg-card p-6 shadow-[var(--shadow-lift)]">
            <figcaption className="flex items-baseline justify-between border-b border-rule pb-3">
              <span className="font-display text-lg font-medium">Team readiness · last 90 days</span>
              <span className="font-mono text-[11px] text-ink-3">Sample data</span>
            </figcaption>
            <ul className="mt-4 space-y-4">
              {readiness.map((r) => (
                <li key={r.category}>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-ink">{r.category}</span>
                    <span className="tabular font-mono text-ink-2">{r.suppressed ? "fewer than 5" : `${r.pct}%`}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-2">
                    {r.suppressed ? null : (
                      <div
                        className={r.pct < 60 ? "h-full bg-tag-yellow" : "h-full bg-pine-3"}
                        style={{ width: `${r.pct}%` }}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[13px] leading-relaxed text-ink-3">
              Paediatric has fewer than five people with completed runs, so it isn&apos;t shown.
            </p>
          </figure>
        </Container>
      </section>

      <section className="border-y border-rule bg-card">
        <Container className="py-16 md:py-24">
          <SectionHeading
            title="How a pilot runs."
            lead="Six months with a group of your paramedics, at a reduced rate, with clear measures agreed up front."
          />
          <ol className="mt-12 grid gap-10 md:grid-cols-4 md:gap-8">
            {[
              ["Weeks 1–2", "Map your medical directives to the scenario library and set up your service's accounts."],
              ["Month 1", "A baseline set of scenarios for everyone in the pilot group."],
              ["Months 2–5", "Regular practice, with a monthly review of team readiness with your training lead."],
              ["Month 6", "A repeat of the baseline set, and a written before-and-after report."],
            ].map(([when, what]) => (
              <li key={when} className="border-t border-ink pt-4">
                <p className="font-mono text-[12px] text-signal">{when}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{what}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <ButtonLink href="/demo" size="lg">
              Talk to us about a pilot
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
