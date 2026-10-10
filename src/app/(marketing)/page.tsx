import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { EcgTrace } from "@/components/clinical/ecg-trace";
import { CallSequence } from "@/components/marketing/call-sequence";
import { HeroCall } from "@/components/marketing/hero-call";
import { HeroStage } from "@/components/marketing/hero-stage";
import { PilotClose } from "@/components/marketing/pilot-close";
import { PrivacyLayersLazy } from "@/components/marketing/privacy-layers-lazy";
import { Container } from "@/components/marketing/section";
import { Statement } from "@/components/marketing/statement";
import { OutcomeTag } from "@/components/ui/outcome-tag";

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
    note: "Runs the pilots and keeps training directors close to the roadmap.",
    photo: "/team/somayyeh-motevalli.jpg",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ─── Hero: the resus bay monitor ─────────────────────────────────── */}
      <section
        data-nav="dark"
        className="relative -mt-24 flex min-h-[100svh] flex-col overflow-hidden bg-[#06110e] text-paper md:-mt-28"
      >
        <HeroStage />
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(55% 55% at 72% 40%, rgb(42 107 88 / 0.22), transparent 70%), radial-gradient(40% 40% at 8% 100%, rgb(194 48 42 / 0.10), transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(to right, #9ff0c4 1px, transparent 1px), linear-gradient(to bottom, #9ff0c4 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 60% 45%, black 20%, transparent 75%)",
          }}
        />

        {/* Monitor chrome */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1320px] justify-between px-5 pt-28 font-mono text-[11px] tracking-[0.16em] text-paper/45 uppercase md:px-10 md:pt-32">
          <span>Bay 04 · Lead II · 25 mm/s</span>
          <span className="hidden md:block">HR 66 · SpO₂ 98 · NIBP 118/76</span>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-1 flex-col justify-center px-5 pt-10 pb-[30vh] md:px-10 md:pb-[28vh]">
          <h1 className="max-w-[11ch] font-display text-[clamp(3.4rem,9.2vw,9.6rem)] leading-[0.9] font-medium tracking-[-0.045em]">
            Make the hard call <em className="font-normal text-[#9ff0c4]">before it&apos;s real.</em>
          </h1>
          <div className="mt-8 flex max-w-xl flex-col gap-7 md:mt-10">
            <p className="text-[18px] leading-relaxed text-paper/72 md:text-[19px]">
              Physician-written emergencies for Canadian paramedics. Every decision scored against protocol the moment
              you make it, and your service sees the team, never one person.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/demo"
                className="group inline-flex h-13 items-center gap-2 rounded-full bg-[#9ff0c4] px-6 text-[15px] font-medium text-[#06110e] transition-colors hover:bg-white"
              >
                Book a demo
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <a
                href="#try"
                className="inline-flex h-13 items-center gap-2 rounded-full border border-white/20 px-6 text-[15px] text-paper transition-colors hover:border-white/50"
              >
                Try a call now
              </a>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute right-5 bottom-[29%] z-10 hidden items-center gap-4 font-mono text-[10px] tracking-[0.16em] text-paper/45 uppercase md:right-10 md:flex">
          <span>Vectorcardiogram</span>
          <span className="flex items-center gap-1.5">
            <i className="size-1.5 rounded-full bg-[#ffd27a]" /> P
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-1.5 rounded-full bg-[#9ff0c4]" /> QRS
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-1.5 rounded-full bg-[#86d9ff]" /> T
          </span>
        </div>
      </section>

      {/* ─── Try it ──────────────────────────────────────────────────────── */}
      <section id="try" className="scroll-mt-24 py-24 md:py-36">
        <Container className="grid items-center gap-14 lg:grid-cols-[0.9fr_minmax(0,560px)] lg:gap-24">
          <div>
            <h2 className="font-display text-[clamp(2.6rem,5.6vw,5.2rem)] leading-[0.95] font-medium tracking-[-0.035em] text-ink">
              One patient. <br />
              Four choices. <br />
              <em className="font-normal text-pine-3">Your call.</em>
            </h2>
            <p className="mt-7 max-w-md text-[18px] leading-relaxed text-ink-2">
              This is how every Imedica scenario feels. Pick what you&apos;d do first. The verdict comes from the
              physician&apos;s rules, instantly, and the patient responds.
            </p>
            <ul className="mt-8 space-y-3 text-[15px] text-ink-2">
              {["Same decision, same score, every time", "Timing counts: right drug, given late, is marked late", "Wrong choices change the patient"].map(
                (t) => (
                  <li key={t} className="flex gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-tag-green" aria-hidden /> {t}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-pine-wash md:-inset-10" aria-hidden />
            <HeroCall />
            <p className="mt-3 text-center text-[12px] text-ink-3">Illustrative case. Follow your service&apos;s medical directives.</p>
          </div>
        </Container>
      </section>

      {/* ─── The gap, as a statement ──────────────────────────────────────── */}
      <section className="border-y border-rule bg-card">
        <Container className="grid gap-10 py-24 md:grid-cols-[1fr_1.2fr] md:py-32">
          <h2 className="font-display text-[clamp(2.2rem,4.4vw,3.8rem)] leading-[1] font-medium tracking-[-0.03em] text-ink">
            The calls that matter most are the ones you see least.
          </h2>
          <div className="space-y-6 text-[18px] leading-relaxed text-ink-2 md:pt-3">
            <p>
              A paediatric arrest. Anaphylaxis at a school. A tricyclic overdose. Some crews meet these once a year, some
              never before the night it counts. Recertification day can&apos;t close that gap, and the road is the wrong
              place to learn.
            </p>
            <p className="text-ink">
              Imedica gives those calls somewhere to happen first: ten-minute scenarios, run between calls on a phone or
              a station computer, each written and checked by an emergency physician.
            </p>
          </div>
        </Container>
      </section>

      {/* ─── Dispatch → Decide → Debrief (scroll-driven) ──────────────────── */}
      <section className="py-16 md:py-24">
        <Container>
          <CallSequence />
        </Container>
      </section>

      {/* ─── Rules decide, Claude explains ───────────────────────────────── */}
      <section data-nav="dark" className="relative overflow-hidden bg-[#06110e] py-28 md:py-40">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-40" aria-hidden>
          <EcgTrace rhythm="sinus" height={120} stroke="rgb(159 240 196 / 0.35)" />
        </div>
        <Container className="relative">
          <Statement
            lines={[
              { text: "Physicians write the rules." },
              { text: "The rules decide the score." },
              { text: "Claude explains why.", accent: true },
            ]}
          />
          <p className="mt-12 max-w-xl text-[18px] leading-relaxed text-paper/65">
            The grade comes from deterministic rules a physician wrote for that moment in the call. Claude then writes the
            debrief in plain language. It can&apos;t change a score, it never sees who you are, and physicians review what
            it writes.
          </p>
        </Container>
      </section>

      {/* ─── The debrief ─────────────────────────────────────────────────── */}
      <section className="py-24 md:py-36">
        <Container className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_0.9fr] lg:gap-24">
          <figure className="relative">
            <div className="absolute -inset-4 -z-10 rotate-[-1.5deg] rounded-[1.75rem] bg-paper-2 md:-inset-8" aria-hidden />
            <div className="rounded-2xl border border-rule bg-card p-6 shadow-[var(--shadow-float)] md:p-8">
              <figcaption className="flex items-end justify-between border-b border-rule pb-5">
                <div>
                  <p className="text-[13px] text-ink-3">Debrief · Inferior STEMI</p>
                  <p className="font-display text-[1.6rem] text-ink">Developing</p>
                </div>
                <p className="tabular font-display text-[3.4rem] leading-none text-ink">78%</p>
              </figcaption>
              <ol className="divide-y divide-rule-2">
                {(
                  [
                    ["00:48", "12-lead ECG", "CORRECT"],
                    ["01:30", "ASA 162 mg chewed", "CORRECT"],
                    ["02:05", "Right-sided leads V4R", "ACCEPTABLE"],
                    ["03:40", "Nitroglycerin 0.4 mg SL", "HARMFUL"],
                    ["05:10", "IV fluid bolus 250 mL", "CORRECT"],
                  ] as const
                ).map(([t, label, outcome]) => (
                  <li key={t} className="flex items-center gap-4 py-3">
                    <span className="tabular w-12 font-mono text-[12px] text-ink-3">{t}</span>
                    <span className="flex-1 text-[15px] text-ink">{label}</span>
                    <OutcomeTag outcome={outcome} />
                  </li>
                ))}
              </ol>
              <div className="mt-3 rounded-xl bg-paper p-5">
                <p className="text-[15px] leading-relaxed text-ink-2">
                  <span className="font-medium text-ink">Why nitro hurt here.</span> V4R showed right-ventricular
                  involvement. The RV depends on preload, so nitroglycerin dropped the pressure to 71/40. The fluid bolus
                  that followed was the right recovery.
                </p>
                <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-ink-3 uppercase">Claude · physician reviewed</p>
              </div>
            </div>
          </figure>
          <div>
            <h2 className="font-display text-[clamp(2.4rem,4.8vw,4.4rem)] leading-[0.98] font-medium tracking-[-0.035em] text-ink">
              Not just a score. <em className="font-normal text-pine-3">The reason.</em>
            </h2>
            <p className="mt-6 text-[18px] leading-relaxed text-ink-2">
              Each decision is tagged in triage colours, with the physician&apos;s rationale, the directive it comes from,
              and the step you missed. Then a short written debrief ties the run together.
            </p>
            <Link
              href="/how-it-works"
              className="group mt-8 inline-flex items-center gap-2 text-[16px] font-medium text-pine underline decoration-pine/30 underline-offset-[6px] hover:decoration-pine"
            >
              See how a scenario is built <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Container>
      </section>

      {/* ─── Privacy ─────────────────────────────────────────────────────── */}
      <section className="border-y border-rule bg-card">
        <Container className="grid items-center gap-14 py-24 md:py-32 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="font-display text-[clamp(2.4rem,4.8vw,4.4rem)] leading-[0.98] font-medium tracking-[-0.035em] text-ink">
              Names and scores never share a table.
            </h2>
            <p className="mt-6 text-[18px] leading-relaxed text-ink-2">
              Who you are lives in one database schema. What you did lives in another, under a keyed one-way hash.
              Reporting reads only the de-identified copy, and refuses to show any group smaller than five people.
            </p>
            <dl className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {[
                ["PIPEDA and PHIPA", "Separation enforced in the data model, not by policy."],
                ["Built for Canadian hosting", "Designed to run entirely in Canadian data centres."],
                ["On the record", "Every edit, invitation and sign-in is audited."],
                ["Nothing sold", "Training data stays with the service that owns it."],
              ].map(([k, v]) => (
                <div key={k} className="border-t border-rule pt-4">
                  <dt className="text-[15px] font-medium text-ink">{k}</dt>
                  <dd className="mt-1 text-[14px] leading-relaxed text-ink-3">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <PrivacyLayersLazy />
        </Container>
      </section>

      {/* ─── Team ────────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-36">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-3xl font-display text-[clamp(2.4rem,5.2vw,4.8rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink">
              Built by clinicians, <em className="font-normal text-pine-3">not an edtech studio.</em>
            </h2>
            <Link href="/about" className="group inline-flex items-center gap-2 text-[15px] font-medium text-pine">
              About Imedica <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <ul className="mt-14 grid gap-5 md:grid-cols-3">
            {team.map((p) => (
              <li key={p.name} className="group relative overflow-hidden rounded-2xl bg-pine">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={p.photo}
                    alt={p.name}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#06110e]/90 to-transparent" aria-hidden />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 text-paper">
                  <p className="font-mono text-[10px] tracking-[0.16em] text-[#9ff0c4] uppercase">{p.role}</p>
                  <h3 className="mt-1.5 font-display text-[1.6rem] leading-tight">{p.name}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-paper/70">{p.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <PilotClose />
    </>
  );
}
