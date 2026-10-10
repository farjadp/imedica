import { Download } from "lucide-react";
import type { Metadata } from "next";

import { LogoMark } from "@/components/brand/logo";
import { Accent, PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/marketing/section";
import { OutcomeTag } from "@/components/ui/outcome-tag";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Brand sheet",
  description: "The Imedica logo, colours, typography and voice, with downloadable logo files for press and partners.",
  alternates: { canonical: "/brand" },
};

const colours = [
  { name: "Brand green", hex: "#17914A", use: "The mark, on light backgrounds", cls: "bg-[#17914a] text-white" },
  { name: "Pine", hex: "#123D31", use: "Primary dark, buttons, headings", cls: "bg-[#123d31] text-white" },
  { name: "Resus bay", hex: "#06110E", use: "Dark sections and the footer", cls: "bg-[#06110e] text-white" },
  { name: "Monitor mint", hex: "#9FF0C4", use: "Accents and the mark on dark", cls: "bg-[#9ff0c4] text-[#06110e]" },
  { name: "Paper", hex: "#F7F6F1", use: "Page background", cls: "bg-[#f7f6f1] text-[#10201c] ring-1 ring-inset ring-[#d9d6cb]" },
  { name: "Ink", hex: "#10201C", use: "Body text", cls: "bg-[#10201c] text-white" },
  { name: "ECG red", hex: "#C2302A", use: "Traces and real alarms only", cls: "bg-[#c2302a] text-white" },
];

const files = [
  { file: "imedica-mark-green.svg", label: "Mark · brand green", bg: "bg-card" },
  { file: "imedica-mark-pine.svg", label: "Mark · pine", bg: "bg-card" },
  { file: "imedica-mark-white.svg", label: "Mark · white", bg: "bg-[#06110e]" },
  { file: "imedica-app-icon.svg", label: "App icon", bg: "bg-paper-2" },
];

const voice = [
  ["Plain over clever", "Write like a calm senior paramedic: short sentences, concrete nouns, no hype."],
  ["Clinical, not cold", "Precise about medicine, warm about people. Never alarmist."],
  ["Honest about limits", "A training tool, not a medical device. Say what it does; don't oversell."],
  ["Canadian", "Canadian spelling, Canadian directives, Canadian privacy law."],
];

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-[clamp(2rem,3.8vw,3.2rem)] leading-none font-medium tracking-[-0.03em] text-ink">{children}</h2>;
}

export default function BrandPage() {
  return (
    <>
      <PageHero
        chrome={["Brand sheet · v1 · October 2026", "For press and partners"]}
        title={
          <>
            One line, <Accent>one heart.</Accent>
          </>
        }
        lead="The iMedica mark is a heart drawn as a single continuous line, with the stem of an i folded into it: care and the person giving it, in one stroke."
        aside={
          <div className="flex items-center justify-center py-6">
            <LogoMark className="size-56 text-[#9ff0c4] drop-shadow-[0_0_40px_rgb(159_240_196/0.35)] md:size-72" />
          </div>
        }
        className="min-h-[80svh]"
      />

      <section className="py-20 md:py-28">
        <Container className="space-y-20">
          <div>
            <H2>
              The <em className="font-normal text-pine-3">logo.</em>
            </H2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="flex aspect-[16/9] items-center justify-center rounded-2xl border border-rule bg-card">
                <span className="inline-flex items-center gap-4">
                  <LogoMark className="size-16" />
                  <span className="font-display text-[3.2rem] leading-none font-semibold tracking-[-0.02em] text-ink">
                    i<span className="text-brand">M</span>edica
                  </span>
                </span>
              </div>
              <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-[#06110e]">
                <span className="inline-flex items-center gap-4">
                  <LogoMark className="size-16 text-[#9ff0c4]" />
                  <span className="font-display text-[3.2rem] leading-none font-semibold tracking-[-0.02em] text-paper">
                    i<span className="text-[#9ff0c4]">M</span>edica
                  </span>
                </span>
              </div>
            </div>
            <ul className="mt-8 grid gap-4 text-[15px] text-ink-2 md:grid-cols-3">
              <li className="border-t border-rule pt-4">
                <strong className="text-ink">Clear space.</strong> Keep at least the width of the stroke on every side of the mark.
              </li>
              <li className="border-t border-rule pt-4">
                <strong className="text-ink">Minimum size.</strong> 16 px for the mark, 96 px wide for the lockup.
              </li>
              <li className="border-t border-rule pt-4">
                <strong className="text-ink">Don&apos;t</strong> stretch it, outline it, add effects or set it on busy photographs.
              </li>
            </ul>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {files.map((f) => (
                <li key={f.file}>
                  <a href={`/brand/${f.file}`} download className="group block overflow-hidden rounded-2xl border border-rule">
                    <span className={`flex aspect-square items-center justify-center ${f.bg}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, shown at its own size */}
                      <img src={`/brand/${f.file}`} alt="" className="size-24" />
                    </span>
                    <span className="flex items-center justify-between border-t border-rule bg-card px-4 py-3 text-[14px] text-ink">
                      {f.label}
                      <Download className="size-4 text-ink-3 group-hover:text-pine" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <H2>
              Colour, <em className="font-normal text-pine-3">from the monitor.</em>
            </H2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {colours.map((c) => (
                <li key={c.hex} className="overflow-hidden rounded-2xl border border-rule bg-card">
                  <div className={`flex aspect-[4/3] items-end p-4 ${c.cls}`}>
                    <span className="font-mono text-[13px]">{c.hex}</span>
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-ink">{c.name}</p>
                    <p className="mt-0.5 text-[13px] text-ink-3">{c.use}</p>
                  </div>
                </li>
              ))}
              <li className="rounded-2xl border border-rule bg-card p-4">
                <p className="font-medium text-ink">Outcome colours</p>
                <p className="mt-0.5 text-[13px] text-ink-3">From Canadian triage tags. Only ever for verdicts.</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(["CORRECT", "ACCEPTABLE", "SUBOPTIMAL", "HARMFUL", "CRITICAL"] as const).map((o) => (
                    <OutcomeTag key={o} outcome={o} />
                  ))}
                </div>
              </li>
            </ul>
          </div>

          <div>
            <H2>
              Type, <em className="font-normal text-pine-3">in three voices.</em>
            </H2>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              <div className="rounded-2xl border border-rule bg-card p-7">
                <p className="font-mono text-[11px] tracking-[0.14em] text-signal uppercase">Display</p>
                <p className="mt-4 font-display text-[3rem] leading-none text-ink">Source Serif 4</p>
                <p className="mt-4 text-[14px] text-ink-3">Headlines and big statements. Italic for the second half of a headline.</p>
              </div>
              <div className="rounded-2xl border border-rule bg-card p-7">
                <p className="font-mono text-[11px] tracking-[0.14em] text-signal uppercase">Text</p>
                <p className="mt-4 text-[2.4rem] leading-none text-ink">IBM Plex Sans</p>
                <p className="mt-4 text-[14px] text-ink-3">Body copy, interface and forms.</p>
              </div>
              <div className="rounded-2xl border border-rule bg-card p-7">
                <p className="font-mono text-[11px] tracking-[0.14em] text-signal uppercase">Monitor</p>
                <p className="mt-4 font-mono text-[2rem] leading-none text-ink">IBM Plex Mono</p>
                <p className="mt-4 text-[14px] text-ink-3">Vitals, timestamps and small labels, in capitals.</p>
              </div>
            </div>
          </div>

          <div>
            <H2>
              How we <em className="font-normal text-pine-3">sound.</em>
            </H2>
            <ul className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
              {voice.map(([t, d]) => (
                <li key={t} className="border-t border-ink pt-5">
                  <p className="font-display text-[1.6rem] text-ink">{t}</p>
                  <p className="mt-1 text-[16px] text-ink-2">{d}</p>
                </li>
              ))}
            </ul>
          </div>

          <p className="border-t border-rule pt-6 text-[15px] text-ink-3">
            Press or partnership request, or need a format that isn&apos;t here? Email{" "}
            <a href={`mailto:${site.contactEmail}`} className="text-pine underline decoration-pine/30 underline-offset-4">
              {site.contactEmail}
            </a>
            .
          </p>
        </Container>
      </section>
    </>
  );
}
