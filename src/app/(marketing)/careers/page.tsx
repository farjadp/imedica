import { ArrowDown, BrainCircuit, Code2, HeartPulse, Stethoscope } from "lucide-react";
import type { Metadata } from "next";

import { CareersForm } from "@/components/marketing/forms";
import { Accent, PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/section";
import { TRACKS } from "@/lib/inbox";

export const metadata: Metadata = {
  title: "Careers",
  description: "Work with Imedica: software engineers, physicians, AI and machine-learning specialists, nurses and paramedics building decision training for emergency care.",
  alternates: { canonical: "/careers" },
};

const tracks = [
  {
    icon: Code2,
    track: "Software engineer",
    title: "Engineers",
    body: "TypeScript, Next.js, Postgres and React Native. You'd work on the call runtime, the physician editor and the privacy model, where correctness and accessibility matter more than features.",
    looking: ["Full-stack TypeScript", "Mobile (React Native / Expo)", "Data privacy and security"],
  },
  {
    icon: Stethoscope,
    track: "Physician",
    title: "Physicians",
    body: "Emergency, anesthesia and critical-care physicians who write scenarios, set the rules that score them, and review what our AI writes. Flexible hours, alongside clinical work.",
    looking: ["Scenario authors", "Second-physician reviewers", "Medical advisory"],
  },
  {
    icon: BrainCircuit,
    track: "AI / ML",
    title: "AI and machine learning",
    body: "Our models explain; they never decide a score. Help us keep explanations accurate, safe and private, and build readiness analytics that never single anyone out.",
    looking: ["LLM evaluation and safety", "Privacy-preserving analytics", "Clinical NLP"],
  },
  {
    icon: HeartPulse,
    track: "Nurse or paramedic",
    title: "Nurses and paramedics",
    body: "The people who'll use Imedica are the best judges of it. Help us shape scenarios that feel like real calls, test new features, and run pilots with services.",
    looking: ["Clinical content and testing", "Pilot coordination", "Education and training design"],
  },
];

export default async function CareersPage({ searchParams }: { searchParams: Promise<{ track?: string }> }) {
  const { track } = await searchParams;
  const defaultTrack = TRACKS.find((t) => t === track);
  return (
    <>
      <PageHero
        chrome={["Careers · Newmarket, Ontario and remote", "Clinicians and engineers, one team"]}
        title={
          <>
            Build the training <Accent>you wish you&apos;d had.</Accent>
          </>
        }
        lead="Imedica is a small team of physicians and engineers. We're looking for people who care about getting emergency care right, and about the privacy of the people who provide it."
        actions={
          <a href="#apply" className="inline-flex h-13 items-center gap-2 rounded-full bg-[#9ff0c4] px-6 text-[15px] font-medium text-[#06110e] transition-colors hover:bg-white">
            Apply <ArrowDown className="size-4" />
          </a>
        }
        className="min-h-[72svh]"
      />

      <section className="py-24 md:py-32">
        <Container>
          <h2 className="max-w-3xl font-display text-[clamp(2.4rem,5.2vw,4.8rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink">
            Four ways <em className="font-normal text-pine-3">in.</em>
          </h2>
          <ul className="mt-16 grid gap-5 md:grid-cols-2">
            {tracks.map(({ icon: Icon, track: t, title, body, looking }) => (
              <li key={title} className="flex flex-col rounded-2xl border border-rule bg-card p-7 md:p-9">
                <Icon className="size-7 text-pine-3" aria-hidden />
                <h3 className="mt-5 font-display text-[2rem] leading-tight font-medium tracking-[-0.02em] text-ink">{title}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{body}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {looking.map((l) => (
                    <li key={l} className="rounded-full bg-paper-2 px-3 py-1.5 text-[13px] text-ink-2">
                      {l}
                    </li>
                  ))}
                </ul>
                <a href={`/careers?track=${encodeURIComponent(t)}#apply`} className="mt-8 self-start text-[15px] font-medium text-pine underline decoration-pine/30 underline-offset-[6px] hover:decoration-pine">
                  Apply as {title.toLowerCase()} →
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="apply" className="scroll-mt-24 border-t border-rule bg-card py-24 md:py-32">
        <Container className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,560px)] lg:gap-20">
          <div>
            <h2 className="font-display text-[clamp(2.4rem,4.8vw,4.4rem)] leading-[0.98] font-medium tracking-[-0.035em] text-ink">
              Tell us <em className="font-normal text-pine-3">who you are.</em>
            </h2>
            <p className="mt-6 max-w-md text-[18px] leading-relaxed text-ink-2">
              We don&apos;t always have an opening posted. If one of the tracks fits you, write anyway: we read every
              application and keep good ones for when the role opens.
            </p>
            <ul className="mt-8 space-y-3 text-[15px] text-ink-2">
              <li>· A link is enough to start: LinkedIn, GitHub, a portfolio or a paper.</li>
              <li>· We reply within two weeks if there&apos;s a fit.</li>
              <li>· Imedica is an equal-opportunity employer.</li>
            </ul>
          </div>
          <CareersForm key={defaultTrack ?? "any"} defaultTrack={defaultTrack} />
        </Container>
      </section>
    </>
  );
}
