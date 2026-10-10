import { Check, ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Accent, PageHero } from "@/components/marketing/page-hero";
import { PilotClose } from "@/components/marketing/pilot-close";
import { Container } from "@/components/marketing/section";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Annual plans for paramedic services, fire departments and long-term care, priced by team size. Six-month pilots at half price.",
  alternates: { canonical: "/pricing" },
};

const tiers = [
  { name: "Fire & long-term care", who: "Fire departments and nursing homes", price: "12,000", seats: "Per site" },
  { name: "Small service", who: "1–20 paramedics", price: "15,000", seats: "Up to 20 seats" },
  { name: "Medium service", who: "21–100 paramedics", price: "30,000", seats: "Up to 100 seats", featured: true },
  { name: "Large service", who: "More than 100 paramedics", price: "50,000", seats: "Seats to fit", from: true },
];

const included = [
  "The full physician-written scenario library",
  "Scoring by deterministic, physician-written rules",
  "Debriefs with the reason behind every verdict",
  "Team readiness by clinical area, in groups of five or more",
  "Invitations, roles and seat management",
  "Audit log of every sign-in and change",
  "Web, iPhone and Android apps",
  "Onboarding: your directives mapped to the library",
];

const faqs = [
  ["Do larger services get more features?", "No. Every plan includes everything. The price follows the size of your team, because that's what drives our cost to support you."],
  ["How does the pilot work?", "Six months with a group of your paramedics at half the annual price, with measures agreed up front: a baseline set in month one, regular practice, and a repeat of the baseline in month six with a written before-and-after report."],
  ["Are prices in Canadian dollars?", "Yes, in CAD, billed annually. Applicable sales tax (HST/GST) is added on the invoice."],
  ["Can an individual paramedic subscribe?", "Not yet. Individual subscriptions, planned at $250 a year, will follow once the service plans are established. Join the app launch list on the download page to hear first."],
  ["What about colleges and hospitals?", "Paramedic programmes and hospital education teams are priced like a service of the same size. Talk to us and we'll quote."],
  ["Where is our data stored?", "Imedica is built to run in Canadian data centres, with names and training data kept in separate database schemas. We confirm the exact hosting arrangement in writing during procurement."],
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        chrome={["Pricing · CAD · billed annually", "Every plan includes everything"]}
        title={
          <>
            One product. <Accent>Priced by team size.</Accent>
          </>
        }
        lead="No feature tiers and no per-scenario fees. Every service gets the whole library, the debriefs and the team reporting. Start with a six-month pilot at half price."
        className="min-h-[70svh] pb-20 md:pb-28"
      />

      <section className="relative z-10 -mt-24 pb-20 md:-mt-32 md:pb-28">
        <Container>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tiers.map((t) => (
              <li
                key={t.name}
                className={cn(
                  "flex flex-col rounded-2xl border p-7 shadow-[var(--shadow-float)]",
                  t.featured ? "border-pine bg-pine text-paper" : "border-rule bg-card text-ink",
                )}
              >
                <p className={cn("font-mono text-[11px] tracking-[0.14em] uppercase", t.featured ? "text-[#9ff0c4]" : "text-signal")}>
                  {t.featured ? "Most services" : t.who}
                </p>
                <h2 className="mt-4 font-display text-[1.7rem] leading-tight font-medium">{t.name}</h2>
                {t.featured ? <p className="mt-1 text-[14px] text-paper/70">{t.who}</p> : null}
                <p className="mt-6 flex items-baseline gap-1.5">
                  {t.from ? <span className={cn("text-[14px]", t.featured ? "text-paper/60" : "text-ink-3")}>from</span> : null}
                  <span className="tabular font-display text-[3rem] leading-none">${t.price}</span>
                </p>
                <p className={cn("mt-1 text-[14px]", t.featured ? "text-paper/60" : "text-ink-3")}>CAD per year · {t.seats}</p>
                <div className={cn("mt-6 border-t pt-5 text-[14px]", t.featured ? "border-white/15 text-paper/75" : "border-rule text-ink-2")}>
                  Pilot: ${(Number(t.price.replace(",", "")) / 2).toLocaleString("en-CA")} for six months
                </div>
                <Link
                  href="/demo"
                  className={cn(
                    "mt-auto inline-flex h-11 items-center justify-center rounded-full text-[15px] font-medium transition-colors",
                    "mt-8",
                    t.featured ? "bg-paper text-pine hover:bg-white" : "bg-ink text-paper hover:bg-pine",
                  )}
                >
                  Talk to us
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-y border-rule bg-card py-20 md:py-28">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <h2 className="font-display text-[clamp(2.2rem,4.4vw,4rem)] leading-[0.98] font-medium tracking-[-0.035em] text-ink">
            In every plan, <em className="font-normal text-pine-3">all of it.</em>
          </h2>
          <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {included.map((i) => (
              <li key={i} className="flex gap-3 text-[16px] text-ink-2">
                <Check className="mt-1 size-4 shrink-0 text-tag-green" aria-hidden /> {i}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-20 md:py-28">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <h2 className="font-display text-[clamp(2.2rem,4.4vw,4rem)] leading-[0.98] font-medium tracking-[-0.035em] text-ink">
            Questions <em className="font-normal text-pine-3">buyers ask.</em>
          </h2>
          <div className="divide-y divide-rule border-y border-rule">
            {faqs.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[17px] font-medium text-ink">
                  {q}
                  <ChevronDown className="mt-1 size-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <PilotClose
        title={
          <>
            Start with <em className="font-normal text-[#9ff0c4]">a half-price pilot.</em>
          </>
        }
      />
    </>
  );
}
