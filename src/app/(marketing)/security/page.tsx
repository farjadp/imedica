import type { Metadata } from "next";

import { site } from "@/lib/site";
import { PrivacyLayersLazy } from "@/components/marketing/privacy-layers-lazy";
import { Container, SectionHeading } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "Privacy & security",
  description: "How Imedica separates identity from training data, what reaches an AI model, and how access is controlled.",
};

const sections = [
  {
    title: "Three schemas that never join",
    body: [
      "Imedica's database is split into three Postgres schemas. Identity holds names, emails, organizations and logins. Content holds scenarios and training runs. Analytics holds the de-identified copies used for reporting.",
      "No table in one schema references another. The only way to connect a person to their training is a keyed one-way hash (HMAC-SHA256) computed by the application with a secret that never enters the database. A copy of the training data alone can't be tied back to anyone.",
    ],
  },
  {
    title: "Reporting that can't single anyone out",
    body: [
      "Analytics records carry no name, no email, no free text and no exact time: completion is stored to the week, and experience as a range. Training directors see figures for their own organization only.",
      "Any figure that would describe fewer than five distinct people is withheld. The check runs inside the reporting query itself.",
    ],
  },
  {
    title: "What the AI model sees",
    body: [
      "When a run ends, the scenario, the decisions and the rule engine's verdicts are sent to Anthropic's Claude to write the explanation. No name, email, organization or identifier is included, and the model can't change a score.",
      "Explanations are checked for anything that looks like personal information before they're stored, and physicians can flag any explanation from the review queue.",
    ],
  },
  {
    title: "Access and accountability",
    body: [
      "Roles are explicit: paramedic, instructor, physician, and Imedica administrator. Instructors only reach their own organization. Sessions are server-side and revocable, passwords are hashed with bcrypt, and resetting a password signs out every device.",
      "Logins, invitations, role changes and every edit to clinical content are written to an audit log.",
    ],
  },
  {
    title: "Where it runs",
    body: [
      "The platform is designed to run entirely in Canadian data centres, with the application and database in the same Canadian region. We'll confirm the exact hosting arrangement in writing during procurement.",
    ],
  },
];

export default function SecurityPage() {
  return (
    <>
      <section className="border-b border-rule">
        <Container className="grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <SectionHeading
            as="h1"
            title="Privacy is in the data model, not the policy."
            lead="Built for PIPEDA and Ontario's PHIPA from the first table. Here's exactly how it works."
          />
          <PrivacyLayersLazy />
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-3xl space-y-16">
            {sections.map((s) => (
              <article key={s.title}>
                <h2 className="font-display text-[1.9rem] font-medium tracking-[-0.015em] text-ink">{s.title}</h2>
                <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-ink-2">
                  {s.body.map((p) => (
                    <p key={p.slice(0, 24)}>{p}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <p className="mt-16 max-w-3xl border-t border-rule pt-6 text-[14px] text-ink-3">
            Questions from a privacy officer or procurement team? Write to {site.privacyEmail} and we&apos;ll answer in
            writing.
          </p>
        </Container>
      </section>
    </>
  );
}
