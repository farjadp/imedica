import type { Metadata } from "next";

import { DarkField } from "@/components/marketing/dark-field";
import { Accent, PageHero } from "@/components/marketing/page-hero";
import { PilotClose } from "@/components/marketing/pilot-close";
import { Container } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "Our commitment",
  description: "The promises behind the Imedica brand: clinical authority, privacy, honesty about what the product is, and respect for the people who use it.",
  alternates: { canonical: "/commitment" },
};

const promises = [
  ["Clinicians decide what's correct.", "Every rule is written by a physician and checked by a second one before it scores anyone. Software applies clinical judgement; it never invents it."],
  ["Nobody is ranked.", "Services see their team by clinical area, never a league table of their own people. Groups smaller than five are withheld, always."],
  ["Your name never meets your score.", "Identity and training data live apart, joined only by a keyed one-way hash. That's architecture, not a policy we could quietly change."],
  ["AI explains. It doesn't judge.", "Our AI model writes debriefs from physician rules. It can't change a score, it never sees who you are, and physicians review what it writes."],
  ["We say what the product is.", "Imedica is a training tool, not a medical device. It never replaces your medical directives, and we won't market it as if it did."],
  ["Built for everyone on the crew.", "Accessible to WCAG 2.1 AA, usable on an old phone, and written in plain language. Reduced-motion and screen-reader users get the full product."],
  ["Canadian first.", "Designed for Canadian directives, Canadian privacy law and Canadian hosting, by a team in Ontario."],
  ["We fix what's wrong, in the open.", "If a scenario or explanation is clinically wrong, we correct it, note the change, and tell the services that used it."],
];

export default function CommitmentPage() {
  return (
    <>
      <PageHero
        chrome={["Our commitment", "Eight promises"]}
        title={
          <>
            What we promise, <Accent>and keep.</Accent>
          </>
        }
        lead="A brand is the promises a company keeps when no one is checking. These are ours, written down so services, paramedics and our own team can hold us to them."
        className="min-h-[72svh]"
      />

      <section className="py-24 md:py-32">
        <Container>
          <ol className="divide-y divide-rule border-y border-rule">
            {promises.map(([title, body], i) => (
              <li key={title} className="grid gap-4 py-10 md:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)] md:gap-10 md:py-12">
                <span className="font-display text-[3rem] leading-none text-pine-3/50">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="font-display text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em] text-ink">{title}</h2>
                <p className="text-[17px] leading-relaxed text-ink-2 md:pt-2">{body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section data-nav="dark" className="relative overflow-hidden bg-[#06110e] py-24 text-paper md:py-32">
        <DarkField glow="center" />
        <Container className="relative max-w-3xl text-center">
          <p className="font-display text-[clamp(1.8rem,3.4vw,2.8rem)] leading-snug">
            If we wouldn&apos;t want it used on our own team, <Accent>we don&apos;t build it.</Accent>
          </p>
          <p className="mt-6 font-mono text-[12px] tracking-[0.14em] text-paper/50 uppercase">The test behind every feature</p>
        </Container>
      </section>

      <PilotClose />
    </>
  );
}
