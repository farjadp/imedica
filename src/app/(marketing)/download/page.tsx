import { ArrowUpRight, BellRing, Fingerprint, History, MonitorSmartphone, ShieldCheck, Timer } from "lucide-react";
import type { Metadata } from "next";

import { EcgTrace } from "@/components/clinical/ecg-trace";
import { AppTour, PhoneShot, type TourStep } from "@/components/marketing/app-tour";
import { WaitlistForm } from "@/components/marketing/forms";
import { LaunchCountdown } from "@/components/marketing/launch-countdown";
import { Accent, PageHero } from "@/components/marketing/page-hero";
import { PilotClose } from "@/components/marketing/pilot-close";
import { Container } from "@/components/marketing/section";
import { StoreBadge } from "@/components/marketing/store-badge";
import { apps } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mobile app for iPhone and Android",
  description:
    "Run Imedica scenarios between calls on your phone: physician-written calls, scored the moment you decide, with the physician's reason in the debrief. On the App Store and Google Play.",
  alternates: { canonical: "/download" },
};

const day = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
const launch = day(apps.launchDate);
const beta = day(apps.betaDate);

const tour: TourStep[] = [
  {
    shot: "/screens/library.webp",
    alt: "The Imedica library: an open post-test, the next call, and scenarios by category",
    time: "00:00",
    title: "Pick up a call.",
    body: "Your service's scenarios, by category, with the next call waiting and any open assessment at the top. Short enough to finish on a break.",
  },
  {
    shot: "/screens/call.webp",
    alt: "A live call: real ECG strip, vitals, the scene and the actions you can take",
    time: "00:15",
    title: "Decide on the clock.",
    body: "A real 12-lead strip from PTB-XL, vitals that move with what you do, and the scene in plain words. The timer is running.",
  },
  {
    shot: "/screens/verdict.webp",
    alt: "A decision scored as correct the moment it's made, with the vitals improving",
    time: "00:39",
    title: "Scored the moment you commit.",
    body: "Every action is checked against rules a physician wrote for your directives. The patient responds, for better or worse.",
  },
  {
    shot: "/screens/debrief.webp",
    alt: "The debrief: score, how the call ended, and each decision with the physician's reason",
    time: "00:52",
    title: "Read the physician's reason.",
    body: "How the call ended, every decision on a timeline, and why it was right or wrong, with a teaching note to go deeper.",
  },
  {
    shot: "/screens/test.webp",
    alt: "A post-test: five questions and two scenarios, the same as before training",
    time: "After",
    title: "Show what changed.",
    body: "Before-and-after assessments run in the app. You see your own answers; your service only ever sees team totals.",
  },
];

const features = [
  { icon: Timer, title: "Ten minutes between calls", body: "Most calls run ten to twelve minutes on the clock: one break, one scenario." },
  { icon: MonitorSmartphone, title: "One account everywhere", body: "Start on the station computer, finish on your phone. History follows you." },
  { icon: Fingerprint, title: "Face ID and fingerprint", body: "Lock the app with your phone's biometrics, so a shared tablet stays yours." },
  { icon: History, title: "Debriefs on hand", body: "Every call you've run, with its verdicts and reasons, ready before your next shift." },
  { icon: BellRing, title: "Told when it matters", body: "A notification when your training lead opens an assessment round." },
  { icon: ShieldCheck, title: "Same privacy model", body: "Identity is kept apart from training data, exactly as on the web." },
];

/** Three real screens fanned out: library, the live call in front, the debrief. */
function PhoneFan() {
  return (
    <div className="relative mx-auto h-[400px] w-full max-w-[560px] sm:h-[560px] md:h-[640px]" aria-hidden>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-40">
        <EcgTrace rhythm="sinus" height={120} stroke="rgb(159 240 196 / 0.55)" />
      </div>
      <div className="absolute top-1/2 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(159_240_196/0.16),transparent)]" />
      <PhoneShot
        src="/screens/library.webp"
        alt=""
        className="absolute top-[10%] left-[2%] w-[38%] -rotate-[9deg] opacity-80 motion-safe:animate-[drift_9s_ease-in-out_infinite]"
      />
      <PhoneShot
        src="/screens/debrief.webp"
        alt=""
        className="absolute top-[10%] right-[2%] w-[38%] rotate-[9deg] opacity-80 motion-safe:animate-[drift_9s_ease-in-out_-4.5s_infinite]"
      />
      <PhoneShot
        src="/screens/call.webp"
        alt=""
        priority
        className="absolute top-0 left-1/2 w-[46%] -translate-x-1/2 shadow-[0_70px_140px_-40px_rgb(0_0_0/0.95)]"
      />
    </div>
  );
}

function Badges({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <div className="flex flex-wrap gap-3">
      <StoreBadge store="ios" tone={tone} />
      <StoreBadge store="android" tone={tone} />
    </div>
  );
}

export default function DownloadPage() {
  const live = Boolean(apps.ios.url && apps.android.url);
  return (
    <>
      <PageHero
        chrome={["Imedica for iPhone and Android", live ? "App Store · Google Play" : `In the stores ${launch}`]}
        title={
          <>
            The hard calls, <Accent>in your pocket.</Accent>
          </>
        }
        lead="Physician-written scenarios, scored the moment you decide, on the phone you already carry. Sign in with the account your training lead invited you to."
        aside={<PhoneFan />}
        actions={<Badges />}
      >
        {live ? null : (
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-paper/55">
            Pilot services get the beta from {beta}:{" "}
            <a href={apps.iosBeta} target="_blank" rel="noopener noreferrer" className="text-[#9ff0c4] underline-offset-4 hover:underline">
              TestFlight on iPhone
            </a>
            , and a Google Play test invite on Android.
          </p>
        )}
      </PageHero>

      <section className="py-24 md:py-32">
        <Container>
          <h2 className="max-w-3xl font-display text-[clamp(2.4rem,5.2vw,4.8rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink">
            One call, <em className="font-normal text-pine-3">start to debrief.</em>
          </h2>
          <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-ink-2">
            These are the app&apos;s real screens, from a trauma call a physician wrote. Scroll through it.
          </p>
          <div className="mt-10 md:mt-16">
            <AppTour steps={tour} />
          </div>
        </Container>
      </section>

      <section className="border-t border-ink/10 bg-paper-2 py-24 md:py-32">
        <Container>
          <h2 className="max-w-3xl font-display text-[clamp(2.2rem,4.4vw,4rem)] leading-[0.98] font-medium tracking-[-0.035em] text-ink">
            Built for the <em className="font-normal text-pine-3">ten minutes you have.</em>
          </h2>
          <ul className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <li key={title} className="border-t border-ink pt-5">
                <Icon className="size-6 text-pine-3" aria-hidden />
                <h3 className="mt-4 font-display text-[1.55rem] leading-tight font-medium tracking-[-0.02em] text-ink">{title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="get" data-nav="dark" className="relative scroll-mt-24 overflow-hidden bg-[#06110e] text-paper">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-25" aria-hidden>
          <EcgTrace rhythm="sinus" height={140} stroke="rgb(159 240 196 / 0.6)" />
        </div>
        <Container className="relative py-24 md:py-36">
          <h2 className="max-w-4xl font-display text-[clamp(3rem,7.4vw,7rem)] leading-[0.92] font-medium tracking-[-0.045em]">
            {live ? (
              <>
                Get Imedica <Accent>on your phone.</Accent>
              </>
            ) : (
              <>
                In both stores <Accent>{day(apps.launchDate).replace(/, \d{4}$/, "")}.</Accent>
              </>
            )}
          </h2>
          <div className="mt-12 grid gap-12 md:grid-cols-2 md:items-end">
            <div className="space-y-8">
              <Badges />
              {live ? null : <LaunchCountdown date={apps.launchDate} />}
            </div>
            <div>
              {live ? (
                <p className="max-w-md text-[17px] leading-relaxed text-paper/70">
                  Free to download. Your service&apos;s Imedica subscription unlocks the scenarios; ask your training lead for an
                  invite.
                </p>
              ) : (
                <>
                  <p className="mb-3 flex items-center gap-2 text-[15px] text-paper/75">
                    <BellRing className="size-4 text-[#9ff0c4]" /> Get an email the day it&apos;s in the stores.
                  </p>
                  <WaitlistForm />
                </>
              )}
              <a
                href="/how-it-works"
                className="mt-8 inline-flex items-center gap-1.5 text-[15px] text-paper/60 transition-colors hover:text-paper"
              >
                How a scenario is built <ArrowUpRight className="size-4" />
              </a>
            </div>
          </div>
          <p className="mt-16 max-w-2xl text-[14px] leading-relaxed text-paper/45">
            The apps are for paramedics whose service uses Imedica. The earlier iMedica BLS app has been retired and is replaced by
            these.
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
