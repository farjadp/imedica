import type { Metadata } from "next";
import Image from "next/image";

import { Container, SectionHeading } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description: "Imedica HealthTech Inc. is a Toronto company founded by clinicians to train emergency decision-making.",
};

const team = [
  {
    name: "Dr. Maryam Daneshian",
    role: "Chief Executive Officer",
    bio: "Anesthesiologist with more than eight years of clinical practice. Leads clinical validation, regulatory work and partnerships with paramedic services.",
    photo: "/team/maryam-daneshian.jpg",
  },
  {
    name: "Dr. Salman Erfanian",
    role: "Chief Product Officer",
    bio: "Emergency medicine specialist with over a decade in acute care. Designs the scenarios, writes their rules and sets the clinical standard for the library.",
    photo: "/team/salman-erfanian.jpg",
  },
  {
    name: "Dr. Somayyeh Motevalli",
    role: "Business Development",
    bio: "Clinician and former clinic operator. Runs the pilot programme and keeps the people who use Imedica close to what gets built next.",
    photo: "/team/somayyeh-motevalli.jpg",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-rule">
        <Container className="py-16 md:py-24">
          <SectionHeading
            as="h1"
            title="Clinicians building the training we wanted."
            lead="Imedica HealthTech Inc. is a Toronto company. We started it because the decisions that matter most in emergency care are the ones crews get the least chance to rehearse."
          />
        </Container>
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <ul className="grid gap-12 md:grid-cols-3 md:gap-8">
            {team.map((p) => (
              <li key={p.name}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-pine">
                  <Image src={p.photo} alt={p.name} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                </div>
                <h2 className="mt-5 text-xl font-medium text-ink">{p.name}</h2>
                <p className="text-[14px] text-pine-3">{p.role}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{p.bio}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t border-rule bg-card">
        <Container className="grid gap-10 py-16 md:grid-cols-[1fr_1fr] md:py-24">
          <SectionHeading title="What we hold ourselves to." />
          <ul className="space-y-6 text-[16px] leading-relaxed text-ink-2">
            <li>
              <span className="font-medium text-ink">Clinicians decide what&apos;s correct.</span> Software applies their
              rules; it doesn&apos;t invent them.
            </li>
            <li>
              <span className="font-medium text-ink">Nobody is ranked.</span> Services see their team, never a list of
              their people&apos;s scores.
            </li>
            <li>
              <span className="font-medium text-ink">We say what the product is.</span> Imedica is a training tool,
              not a medical device, and it never replaces your medical directives.
            </li>
          </ul>
          <div className="md:col-span-2">
            <ButtonLink href="/demo" size="lg">
              Get in touch
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
