import { Check, X } from "lucide-react";
import type { Metadata } from "next";

import { site } from "@/lib/site";
import { DarkField } from "@/components/marketing/dark-field";
import { Accent, PageHero } from "@/components/marketing/page-hero";
import { PilotClose } from "@/components/marketing/pilot-close";
import { PrivacyLayersLazy } from "@/components/marketing/privacy-layers-lazy";
import { Container } from "@/components/marketing/section";
import { Statement } from "@/components/marketing/statement";

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

const sent = ["The scenario and its moments", "Each decision and when it was made", "The rule engine's verdict for each one"];
const neverSent = ["Name, email or employee number", "Organization or service", "Any identifier that could be joined back"];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        chrome={["Schemas · identity / content / analytics", "PIPEDA · PHIPA · k ≥ 5"]}
        title={
          <>
            Privacy lives in the <Accent>data model.</Accent>
          </>
        }
        lead="Built for PIPEDA and Ontario's PHIPA from the first table. Who you are and what you did are stored apart, and only a keyed hash connects them."
        aside={<PrivacyLayersLazy tone="dark" className="-mx-5 md:mx-0" />}
        glow="right"
      />

      <section className="py-24 md:py-36">
        <Container className="grid gap-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-24">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <h2 className="font-display text-[clamp(2.4rem,4.8vw,4.4rem)] leading-[0.98] font-medium tracking-[-0.035em] text-ink">
              What a privacy officer <em className="font-normal text-pine-3">will ask.</em>
            </h2>
            <p className="mt-6 max-w-sm text-[17px] leading-relaxed text-ink-2">
              The answers below describe the code as it runs, not a policy we intend to follow.
            </p>
          </div>
          <ol className="space-y-16 md:space-y-20">
            {sections.map((s, i) => (
              <li key={s.title} className="border-t border-ink pt-6">
                <p className="font-mono text-[12px] tracking-[0.14em] text-signal uppercase">
                  {String(i + 1).padStart(2, "0")} / {String(sections.length).padStart(2, "0")}
                </p>
                <h3 className="mt-4 font-display text-[clamp(1.9rem,3vw,2.6rem)] leading-[1.05] font-medium tracking-[-0.025em] text-ink">
                  {s.title}
                </h3>
                <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-ink-2">
                  {s.body.map((p) => (
                    <p key={p.slice(0, 24)}>{p}</p>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section data-nav="dark" className="relative overflow-hidden bg-[#06110e] py-28 text-paper md:py-40">
        <DarkField glow="center" />
        <Container className="relative">
          <Statement
            lines={[
              { text: "Names live in one place." },
              { text: "Scores live in another." },
              { text: "Only a hash connects them.", accent: true },
            ]}
          />
        </Container>
      </section>

      <section className="border-b border-rule bg-card py-24 md:py-36">
        <Container>
          <h2 className="max-w-3xl font-display text-[clamp(2.4rem,4.8vw,4.4rem)] leading-[0.98] font-medium tracking-[-0.035em] text-ink">
            What reaches the <em className="font-normal text-pine-3">AI model.</em>
          </h2>
          <p className="mt-6 max-w-2xl text-[18px] leading-relaxed text-ink-2">
            When a run ends, Anthropic&apos;s Claude writes the debrief. It gets the clinical picture and nothing about the
            person. It can&apos;t change a score, its writing is checked for anything that looks like personal information
            before it&apos;s stored, and physicians can flag any explanation from the review queue.
          </p>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-rule bg-paper p-7 md:p-9">
              <p className="font-mono text-[11px] tracking-[0.14em] text-tag-green uppercase">Sent</p>
              <ul className="mt-6 space-y-4">
                {sent.map((t) => (
                  <li key={t} className="flex gap-3 font-display text-[1.45rem] leading-snug text-ink">
                    <Check className="mt-1.5 size-5 shrink-0 text-tag-green" aria-hidden /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-[#06110e] p-7 text-paper md:p-9">
              <p className="font-mono text-[11px] tracking-[0.14em] text-[#ff8a80] uppercase">Never sent</p>
              <ul className="mt-6 space-y-4">
                {neverSent.map((t) => (
                  <li key={t} className="flex gap-3 font-display text-[1.45rem] leading-snug text-paper/90">
                    <X className="mt-1.5 size-5 shrink-0 text-[#ff8a80]" aria-hidden /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <PilotClose
        title={
          <>
            Questions from your <em className="font-normal text-[#9ff0c4]">privacy officer?</em>
          </>
        }
        body={`Send them to ${site.privacyEmail}. We answer procurement and privacy questionnaires in writing, and we'll walk your team through the data model on a call.`}
        cta="Write to us"
        href={`mailto:${site.privacyEmail}`}
      />
    </>
  );
}
