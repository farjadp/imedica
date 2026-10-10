import type { Metadata } from "next";
import Image from "next/image";

import { EcgTrace } from "@/components/clinical/ecg-trace";
import { DarkField } from "@/components/marketing/dark-field";
import { Accent, PageHero } from "@/components/marketing/page-hero";
import { PilotClose } from "@/components/marketing/pilot-close";
import { Container } from "@/components/marketing/section";
import { Statement } from "@/components/marketing/statement";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "About",
  description: "Imedica HealthTech Inc. is an Ontario company, based in Newmarket, founded by clinicians to train emergency decision-making.",
};

const team = [
  {
    name: "Dr. Maryam Daneshian",
    role: "Chief Executive Officer",
    field: "Anesthesiology",
    bio: "Anesthesiologist with more than eight years of clinical practice. Leads clinical validation, regulatory work and partnerships with paramedic services.",
    photo: "/team/maryam-daneshian.jpg",
  },
  {
    name: "Dr. Salman Erfanian",
    role: "Chief Product Officer",
    field: "Emergency medicine",
    bio: "Emergency medicine specialist with over a decade in acute care. Designs the scenarios, writes their rules and sets the clinical standard for the library.",
    photo: "/team/salman-erfanian.jpg",
  },
  {
    name: "Dr. Somayyeh Motevalli",
    role: "Business Development",
    field: "Clinical operations",
    bio: "Clinician and former clinic operator. Runs the pilot programme and keeps the people who use Imedica close to what gets built next.",
    photo: "/team/somayyeh-motevalli.jpg",
  },
];

const principles = [
  ["Clinicians decide what's correct.", "Software applies their rules. It doesn't invent them."],
  ["Nobody is ranked.", "Services see their team, never a list of their people's scores."],
  ["We say what the product is.", "Imedica is a training tool, not a medical device, and it never replaces your medical directives."],
];

/** The founders, staggered like contact sheets pinned to the monitor. */
function Portraits() {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      {team.map((p, i) => (
        <figure key={p.name} className={cn("min-w-0", i === 1 && "mt-10 md:mt-16", i === 2 && "mt-20 md:mt-32")}>
          <div className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-pine ring-1 ring-white/10">
            <Image
              src={p.photo}
              alt={p.name}
              fill
              priority
              sizes="(min-width: 1024px) 16vw, 33vw"
              className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#06110e]/80 to-transparent" aria-hidden />
          </div>
          <figcaption className="mt-3 font-mono text-[10px] leading-snug tracking-[0.14em] text-paper/55 uppercase">
            <span className="block text-[#9ff0c4]">{p.field}</span>
            <span className="hidden sm:block">{p.name.replace("Dr. ", "")}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <PageHero
        chrome={["Imedica HealthTech Inc. · Newmarket, Ontario", "Founded by clinicians"]}
        title={
          <>
            Clinicians building <Accent>the training we wanted.</Accent>
          </>
        }
        lead="We started Imedica because the decisions that matter most in emergency care are the ones crews get the least chance to rehearse."
        glow="left"
        aside={<Portraits />}
        backdrop={
          <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-40" aria-hidden>
            <EcgTrace rhythm="sinus" height={110} stroke="rgb(159 240 196 / 0.45)" />
          </div>
        }
      />

      <section className="py-24 md:py-36">
        <Container>
          <h2 className="max-w-3xl font-display text-[clamp(2.4rem,5.2vw,4.8rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink">
            Three physicians, <em className="font-normal text-pine-3">one standard.</em>
          </h2>
          <ul className="mt-16 grid gap-14 md:mt-20 md:grid-cols-3 md:gap-10">
            {team.map((p, i) => (
              <li key={p.name} className="border-t border-ink pt-6">
                <p className="font-mono text-[12px] tracking-[0.14em] text-signal uppercase">
                  {String(i + 1).padStart(2, "0")} · {p.field}
                </p>
                <h3 className="mt-4 font-display text-[clamp(2rem,3vw,2.6rem)] leading-[1.02] font-medium tracking-[-0.03em] text-ink">
                  {p.name}
                </h3>
                <p className="mt-2 text-[16px] text-pine-3">{p.role}</p>
                <p className="mt-5 text-[17px] leading-relaxed text-ink-2">{p.bio}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section data-nav="dark" className="relative overflow-hidden bg-[#06110e] py-28 text-paper md:py-40">
        <DarkField glow="center" />
        <Container className="relative">
          <p className="mb-10 font-mono text-[12px] tracking-[0.14em] text-paper/45 uppercase">What we hold ourselves to</p>
          <Statement lines={principles.map(([t], i) => ({ text: t, accent: i === principles.length - 1 }))} />
          <dl className="mt-16 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-3">
            {principles.map(([t, d]) => (
              <div key={t}>
                <dt className="text-[15px] font-medium text-paper">{t}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-paper/60">{d}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <PilotClose
        title={
          <>
            Train with <em className="font-normal text-[#9ff0c4]">people who&apos;ve been there.</em>
          </>
        }
        body="Thirty minutes with a physician from our team: a live scenario, the debrief, and how a pilot would work for your service."
        cta="Get in touch"
      />
    </>
  );
}
