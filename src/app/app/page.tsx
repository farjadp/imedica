import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { categoryLabel, difficultyLabel, formatDate } from "@/lib/labels";
import { myAssessments } from "@/server/assessments/taking";
import { requireUserPage } from "@/server/auth/guards";
import { libraryFor } from "@/server/sessions/queries";
import { listMySessions } from "@/server/sessions/service";

export const metadata = { title: "Today" };

export default async function TodayPage() {
  const user = await requireUserPage("/app");
  const [library, recent, assessments] = await Promise.all([libraryFor(user), listMySessions(user, 5), myAssessments(user)]);
  const due = assessments.find((a) => !a.completed);

  const live = library.find((s) => s.liveSessionId);
  const next = library.filter((s) => s.attempts === 0).slice(0, 3);
  const practise = library
    .filter((s) => s.best !== null && s.best < 75)
    .sort((a, b) => (a.best ?? 0) - (b.best ?? 0))
    .slice(0, 2);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-[2.2rem] leading-tight font-medium tracking-[-0.015em] text-ink">
          Ready when you are, {user.preferredName ?? user.firstName}.
        </h1>
        <p className="mt-2 text-[15px] text-ink-2">
          A scenario takes ten to fifteen minutes. Your results are yours: your service only ever sees team totals.
        </p>
      </header>

      {due ? (
        <section className="flex flex-col gap-4 rounded-lg border border-rule bg-card p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[13px] font-medium text-pine-3">
              {due.phase === "PRE" ? "Before-training assessment" : "After-training assessment"} is open
            </p>
            <p className="mt-0.5 text-[17px] font-medium text-ink">{due.assessment.title}</p>
          </div>
          <ButtonLink href="/app/assessments" variant="secondary">
            {due.attemptId ? "Continue" : "Take it"}
          </ButtonLink>
        </section>
      ) : null}

      {live ? (
        <section className="flex flex-col gap-4 rounded-lg border border-signal/30 bg-signal-wash p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[13px] font-medium text-signal">Run in progress</p>
            <p className="mt-0.5 text-[17px] font-medium text-ink">{live.title}</p>
          </div>
          <ButtonLink href={`/run/${live.liveSessionId}`}>Return to the call</ButtonLink>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-[17px] font-medium text-ink">{next.length ? "Not tried yet" : "Run one again"}</h2>
        {library.length === 0 ? (
          <EmptyState title="The library is empty" body="Your physicians are still writing scenarios. Check back soon." />
        ) : (
          <ul className="divide-y divide-rule-2 rounded-lg border border-rule bg-card">
            {(next.length ? next : library.slice(0, 3)).map((s) => (
              <li key={s.id}>
                <Link href={`/app/scenarios/${s.id}`} className="group flex items-center gap-5 px-5 py-4 hover:bg-paper">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-ink">{s.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[14px] text-ink-3">{s.summary}</p>
                  </div>
                  <span className="hidden text-[13px] text-ink-3 sm:block">
                    {categoryLabel[s.category]} · {difficultyLabel[s.difficulty]}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[12px] text-ink-3">
                    <Clock className="size-3.5" /> {Math.round(s.timeLimitSec / 60)}m
                  </span>
                  <ArrowRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {practise.length ? (
        <section>
          <h2 className="mb-4 text-[17px] font-medium text-ink">Worth another run</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {practise.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 rounded-lg border border-rule bg-card px-5 py-4">
                <div>
                  <p className="text-[15px] font-medium text-ink">{s.title}</p>
                  <p className="text-[13px] text-ink-3">Your best: {s.best}%</p>
                </div>
                <ButtonLink href={`/app/scenarios/${s.id}`} variant="secondary" size="sm">
                  Try again
                </ButtonLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recent.length ? (
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[17px] font-medium text-ink">Your recent runs</h2>
            <Link href="/app/history" className="text-[14px] text-pine-3 hover:underline">
              All runs
            </Link>
          </div>
          <ul className="divide-y divide-rule-2 rounded-lg border border-rule bg-card">
            {recent
              .filter((r) => r.status !== "IN_PROGRESS")
              .map((r) => (
                <li key={r.id}>
                  <Link href={`/app/review/${r.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-paper">
                    <span className="flex-1 text-[14px] text-ink">{r.scenario.title}</span>
                    <span className="text-[13px] text-ink-3">{formatDate(r.startedAt)}</span>
                    <span className="tabular w-12 text-right font-mono text-[14px] text-ink">{r.percent}%</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
