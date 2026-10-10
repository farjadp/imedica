import { Apple, BellRing, History, MonitorSmartphone, Play, ShieldCheck, Timer } from "lucide-react";
import type { Metadata } from "next";

import { EcgTrace } from "@/components/clinical/ecg-trace";
import { LogoMark } from "@/components/brand/logo";
import { WaitlistForm } from "@/components/marketing/forms";
import { LaunchCountdown } from "@/components/marketing/launch-countdown";
import { Accent, PageHero } from "@/components/marketing/page-hero";
import { PilotClose } from "@/components/marketing/pilot-close";
import { Container } from "@/components/marketing/section";
import { OutcomeTag } from "@/components/ui/outcome-tag";
import { apps } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mobile app for iPhone and Android",
  description: "Run Imedica scenarios between calls on your phone. The iPhone and Android apps launch on October 20, 2026.",
  alternates: { canonical: "/download" },
};

const launch = new Date(`${apps.launchDate}T12:00:00`).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });

/** A phone showing the call runtime: monitor, the moment, and a verdict. */
function Phone() {
  return (
    <div className="relative mx-auto w-[280px] md:w-[300px]" aria-hidden>
      <div className="absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,rgb(159_240_196/0.18),transparent)]" />
      <div className="relative rounded-[3rem] border border-white/15 bg-[#030806] p-3 shadow-[0_60px_120px_-40px_rgb(0_0_0/0.9)]">
        <div className="overflow-hidden rounded-[2.4rem] bg-[#0b1714]">
          <div className="flex items-center justify-between px-6 pt-4 pb-2 font-mono text-[10px] text-paper/50">
            <span>9:41</span>
            <span className="h-5 w-20 rounded-full bg-black" />
            <span>5G</span>
          </div>
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <LogoMark className="size-5 text-[#9ff0c4]" />
            <p className="truncate text-[12px] text-paper">Anaphylaxis after a wasp sting</p>
            <span className="tabular ml-auto rounded bg-[#c2302a]/20 px-1.5 font-mono text-[11px] text-[#ff8a80]">06:12</span>
          </div>
          <div className="grid grid-cols-4 border-b border-white/10 font-mono">
            {[
              ["HR", "128"],
              ["BP", "84/50"],
              ["SpO₂", "89"],
              ["RR", "30"],
            ].map(([k, v]) => (
              <div key={k} className="border-r border-white/10 px-2.5 py-2 last:border-r-0">
                <p className="text-[8px] tracking-[0.14em] text-paper/45 uppercase">{k}</p>
                <p className="tabular text-[15px] text-paper">{v}</p>
              </div>
            ))}
          </div>
          <EcgTrace rhythm="sinus" height={52} stroke="rgb(159 240 196 / 0.9)" />
          <div className="space-y-2 p-4">
            <p className="font-mono text-[9px] tracking-[0.14em] text-paper/45 uppercase">What do you do first?</p>
            {["Epinephrine IM", "Diphenhydramine IV", "Salbutamol neb", "Load and go"].map((a, i) => (
              <div key={a} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-[12px] ${i === 0 ? "border-[#9ff0c4]/50 bg-[#9ff0c4]/10 text-paper" : "border-white/10 text-paper/75"}`}>
                {a}
                {i === 0 ? <OutcomeTag outcome="CORRECT" className="h-5 px-1.5 text-[9px]" /> : null}
              </div>
            ))}
          </div>
          <div className="px-4 pb-6">
            <p className="rounded-xl bg-white/[0.04] p-3 text-[11px] leading-relaxed text-paper/65">
              Airway swelling and hypotension: epinephrine first, without waiting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreButton({ store, url }: { store: "ios" | "android"; url: string | null }) {
  const Icon = store === "ios" ? Apple : Play;
  const label = store === "ios" ? "App Store" : "Google Play";
  const body = (
    <>
      <Icon className="size-6" aria-hidden />
      <span className="text-left leading-tight">
        <span className="block text-[11px] opacity-70">{url ? (store === "ios" ? "Download on the" : "Get it on") : `Coming ${launch}`}</span>
        <span className="block text-[17px] font-medium">{label}</span>
      </span>
    </>
  );
  const cls = "inline-flex h-14 items-center gap-3 rounded-2xl border px-5 transition-colors";
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`${cls} border-white/20 bg-white text-[#06110e] hover:bg-[#9ff0c4]`}>
      {body}
    </a>
  ) : (
    <span className={`${cls} cursor-default border-white/15 text-paper/70`} aria-disabled="true">
      {body}
    </span>
  );
}

const features = [
  { icon: Timer, title: "Ten minutes between calls", body: "Scenarios are short enough to finish on a break, and pick up where you left off." },
  { icon: MonitorSmartphone, title: "Same account everywhere", body: "Start on the station computer, finish on your phone. Runs and history follow you." },
  { icon: History, title: "Your debriefs, on hand", body: "Every decision, its verdict and the physician's reason, ready to review before your next shift." },
  { icon: ShieldCheck, title: "Same privacy model", body: "The app uses the same API and the same separation of identity from training data as the web." },
];

export default function DownloadPage() {
  const live = Boolean(apps.ios.url || apps.android.url);
  return (
    <>
      <PageHero
        chrome={["Imedica for iPhone and Android", `Launch · ${launch}`]}
        title={
          <>
            The hard calls, <Accent>in your pocket.</Accent>
          </>
        }
        lead="Physician-written scenarios, scored the moment you decide, on the phone you already carry. The new apps for iPhone and Android launch together."
        aside={<Phone />}
        actions={
          <>
            <StoreButton store="ios" url={apps.ios.url} />
            <StoreButton store="android" url={apps.android.url} />
          </>
        }
      >
        {live ? null : (
          <div className="mt-12 space-y-6 border-t border-white/10 pt-8">
            <LaunchCountdown date={apps.launchDate} />
            <div>
              <p className="mb-3 flex items-center gap-2 text-[15px] text-paper/75">
                <BellRing className="size-4 text-[#9ff0c4]" /> Get an email the day it&apos;s in the store.
              </p>
              <WaitlistForm />
            </div>
          </div>
        )}
      </PageHero>

      <section className="py-24 md:py-32">
        <Container>
          <h2 className="max-w-3xl font-display text-[clamp(2.4rem,5.2vw,4.8rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink">
            Built for the <em className="font-normal text-pine-3">ten minutes you have.</em>
          </h2>
          <ul className="mt-16 grid gap-x-12 gap-y-12 md:grid-cols-2">
            {features.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-5 border-t border-ink pt-6">
                <Icon className="mt-1 size-6 shrink-0 text-pine-3" aria-hidden />
                <div>
                  <h3 className="font-display text-[1.7rem] leading-tight font-medium tracking-[-0.02em] text-ink">{title}</h3>
                  <p className="mt-2 max-w-md text-[17px] leading-relaxed text-ink-2">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-14 max-w-2xl text-[15px] leading-relaxed text-ink-3">
            The apps are for paramedics whose service uses Imedica: sign in with the account your training lead invited you
            to. The earlier iMedica BLS app has been retired and is replaced by these.
          </p>
        </Container>
      </section>

      <PilotClose
        title={
          <>
            Bring it to <em className="font-normal text-[#9ff0c4]">your whole service.</em>
          </>
        }
      />
    </>
  );
}
