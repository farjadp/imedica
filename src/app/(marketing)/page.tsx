import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { EcgTrace } from "@/components/clinical/ecg-trace";
import { HeroCall } from "@/components/marketing/hero-call";
import { PrivacyLayersLazy } from "@/components/marketing/privacy-layers-lazy";
import { Container, SectionHeading } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";
import { OutcomeTag } from "@/components/ui/outcome-tag";

const runReport = [
  {
    time: "00:00",
    name: "Dispatch",
    body: "The call arrives the way it would on the road: age, complaint, what bystanders said. You walk in with the same thin picture.",
  },
  {
    time: "00:40",
    name: "Decide",
    body: "Vitals move. The patient answers, or doesn't. You choose from the full action menu (assessments, drugs, procedures, transport) with the clock running.",
  },
  {
    time: "09:15",
    name: "Debrief",
    body: "Every decision comes back tagged against the physician's rules, with the reason, the protocol behind it, and what a stronger run looked like.",
  },
];

const team = [
  {
    name: "Dr. Maryam Daneshian",
    role: "Chief Executive Officer",
    note: "Anesthesiologist. Owns clinical validation and the partnerships with services.",
    photo: "/team/maryam-daneshian.jpg",
  },
  {
    name: "Dr. Salman Erfanian",
    role: "Chief Product Officer",
    note: "Emergency medicine. Writes and reviews the scenarios and their rules.",
    photo: "/team/salman-erfanian.jpg",
  },
  {
    name: "Dr. Somayyeh Motevalli",
    role: "Business Development",
    note: "Runs pilots and keeps training directors close to the roadmap.",
    photo: "/team/somayyeh-motevalli.jpg",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero: the product, working, in the first viewport. */}
      <section className="relative overflow-hidden border-b border-rule">
        <Container className="grid items-center gap-12 pt-10 pb-16 md:pt-16 lg:grid-cols-[1fr_minmax(0,540px)] lg:gap-16 lg:pb-24">
          <div>
            <h1 className="font-display text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.98] font-medium tracking-[-0.03em] text-ink">
              Make the hard call
              <br />
              before it&apos;s real.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink-2">
              Imedica puts paramedics inside physician-written emergencies and scores every decision against
              protocol the moment it&apos;s made. Your service sees where the team is strong and where it isn&apos;t,
              never one person&apos;s results.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/demo" size="lg">
                Request a demo
              </ButtonLink>
              <ButtonLink href="/how-it-works" size="lg" variant="secondary">
                How a scenario works
              </ButtonLink>
            </div>
            <p className="mt-6 text-[13px] text-ink-3">
              For EMS, fire and hospital services in Canada. Pilots open in Ontario for 2026.
            </p>
          </div>

          <div>
            <HeroCall />
            <p className="mt-3 text-center text-[12px] text-ink-3">
              Illustrative case. Follow your own service&apos;s medical directives.
            </p>
          </div>
        </Container>
      </section>

      {/* The gap */}
      <section className="py-20 md:py-28">
        <Container className="grid gap-12 md:grid-cols-[1fr_1fr] md:gap-20">
          <SectionHeading title="The calls that matter most are the ones you see least." />
          <div className="space-y-5 text-[17px] leading-relaxed text-ink-2">
            <p>
              A paediatric arrest, anaphylaxis at a school, a tricyclic overdose: some crews meet these once a year,
              some never before the night it counts. Recertification day can&apos;t make up the difference, and the
              road is the wrong place to learn.
            </p>
            <p>
              Imedica gives those rare calls a place to happen first. Short scenarios, run on a phone or a station
              computer between calls, each one written and checked by an emergency physician.
            </p>
          </div>
        </Container>
      </section>

      {/* Run report: dispatch → decide → debrief */}
      <section className="border-y border-rule bg-card">
        <Container className="py-20 md:py-28">
          <SectionHeading
            title="Every scenario runs like a call."
            lead="Ten to fifteen minutes from dispatch to debrief, timed the way the road is."
          />
          <div className="mt-14">
            <div className="ecg-paper relative mb-10 overflow-hidden rounded-md border border-rule">
              <EcgTrace rhythm="sinus" height={56} />
            </div>
            <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
              {runReport.map((s) => (
                <li key={s.name} className="border-t border-ink pt-5">
                  <p className="font-mono text-[12px] text-signal">{s.time}</p>
                  <h3 className="mt-1 font-display text-2xl font-medium text-ink">{s.name}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* Rules decide, AI explains */}
      <section className="py-20 md:py-28">
        <Container className="grid items-start gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <div>
            <SectionHeading
              title="Physicians write the rules. The rules decide the score."
              lead="The grade comes from deterministic rules a physician wrote for that exact moment in the call. Claude then explains each verdict in plain language. It can't change a score, and every explanation is open to physician review."
            />
            <ul className="mt-8 space-y-3 text-[15px] text-ink-2">
              {[
                "Same decision, same score, every time",
                "Timing counts: the right drug, given late, is marked late",
                "Explanations cite the directive they come from",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-tag-green" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <figure className="rounded-xl border border-rule bg-card p-5 shadow-[var(--shadow-lift)] md:p-6">
            <figcaption className="flex items-baseline justify-between border-b border-rule pb-3">
              <span className="font-display text-lg font-medium">Debrief · Inferior STEMI</span>
              <span className="tabular font-mono text-sm text-ink-2">78%</span>
            </figcaption>
            <ol className="divide-y divide-rule-2">
              {(
                [
                  ["00:48", "12-lead ECG", "CORRECT"],
                  ["01:30", "ASA 162 mg chewed", "CORRECT"],
                  ["02:05", "Right-sided leads V4R", "ACCEPTABLE"],
                  ["03:40", "Nitroglycerin 0.4 mg SL", "HARMFUL"],
                  ["05:10", "IV access, fluid bolus 250 mL", "CORRECT"],
                ] as const
              ).map(([t, label, outcome]) => (
                <li key={t} className="flex items-center gap-4 py-3">
                  <span className="tabular w-12 font-mono text-[12px] text-ink-3">{t}</span>
                  <span className="flex-1 text-[14px] text-ink">{label}</span>
                  <OutcomeTag outcome={outcome} />
                </li>
              ))}
            </ol>
            <div className="mt-2 rounded-md bg-paper p-4">
              <p className="text-[14px] leading-relaxed text-ink-2">
                <span className="font-medium text-ink">Why nitro hurt here.</span> V4R showed right ventricular
                involvement. The RV depends on preload, so nitroglycerin dropped the pressure to 71/40. The fluid
                bolus that followed was the right recovery.
              </p>
              <p className="mt-3 font-mono text-[11px] tracking-wide text-ink-3 uppercase">
                AI explanation · physician reviewed
              </p>
            </div>
          </figure>
        </Container>
      </section>

      {/* Privacy */}
      <section className="border-y border-rule bg-card">
        <Container className="grid items-center gap-12 py-20 md:py-28 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <PrivacyLayersLazy />
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading
              title="Names and scores never sit in the same place."
              lead="Who you are lives in one database schema. What you did in training lives in another, under a keyed one-way hash. Reporting reads only the second one, and refuses to show any group smaller than five people."
            />
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              {[
                ["PIPEDA and PHIPA by design", "Separation is enforced in the data model, not by policy."],
                ["Built for Canadian hosting", "Designed to run entirely in Canadian data centres."],
                ["Every change on the record", "Who edited a scenario or invited a user, and when."],
                ["Nothing sold, nothing shared", "Training data stays with the service that owns it."],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[15px] font-medium text-ink">{k}</dt>
                  <dd className="mt-1 text-[14px] leading-relaxed text-ink-3">{v}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/security"
              className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-medium text-pine underline decoration-pine/30 hover:decoration-pine"
            >
              Read how the privacy model works <ArrowRight className="size-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* Team */}
      <section className="py-20 md:py-28">
        <Container>
          <SectionHeading
            title="Built by clinicians, not an edtech studio."
            lead="Imedica was founded in Toronto by clinicians who know what the first ten minutes of an emergency ask of a crew."
          />
          <ul className="mt-12 grid gap-8 sm:grid-cols-3">
            {team.map((p) => (
              <li key={p.name}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-pine">
                  <Image
                    src={p.photo}
                    alt={p.name}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-4 text-[17px] font-medium text-ink">{p.name}</h3>
                <p className="text-[14px] text-pine-3">{p.role}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-3">{p.note}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Close */}
      <section className="bg-pine text-paper">
        <Container className="grid items-end gap-10 py-20 md:grid-cols-[1.4fr_1fr] md:py-24">
          <div>
            <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.04] font-medium tracking-[-0.02em]">
              Run a pilot with your service.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-paper/80">
              Six months, your paramedics, a scenario set matched to your directives, and a before-and-after look at
              where the team improved.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <ButtonLink href="/demo" size="lg" variant="light">
              Request a demo
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
