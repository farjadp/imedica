import { AlertTriangle, BookOpen } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AiExplanation } from "@/components/runtime/ai-explanation";
import { ButtonLink } from "@/components/ui/button";
import { OutcomeTag } from "@/components/ui/outcome-tag";
import { cn } from "@/lib/cn";
import { clock } from "@/lib/labels";
import { HttpError, requireUserPage } from "@/server/auth/guards";
import { DebriefLocked, getReview } from "@/server/sessions/service";

export const metadata = { title: "Debrief" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/app/review/${id}`);
  let r;
  try {
    r = await getReview(user, id);
  } catch (error) {
    if (error instanceof DebriefLocked) redirect(`/app/assessments/${error.attemptId}`);
    if (error instanceof HttpError && error.status === 404) notFound();
    if (error instanceof HttpError && error.status === 409) redirect(`/run/${id}`);
    throw error;
  }

  const tone =
    r.grade === "Excellent" || r.grade === "Proficient" ? "text-tag-green" : r.grade === "Developing" ? "text-tag-yellow" : "text-tag-red";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <p className="text-[14px]">
        <Link href="/app/history" className="text-ink-3 hover:text-ink">
          ← My runs
        </Link>
      </p>

      <header className="grid gap-6 border-b border-rule pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-[13px] text-ink-3">
            Debrief · {r.status === "TIMED_OUT" ? "time ran out" : "completed"} in {clock(r.durationSec * 1000)}
          </p>
          <h1 className="mt-1 font-display text-[2.2rem] leading-tight font-medium tracking-[-0.015em] text-ink">{r.scenario.title}</h1>
          {r.endState ? <p className="mt-2 text-[15px] text-ink-2">Ended at: {r.endState.title}</p> : null}
        </div>
        <div className="text-left md:text-right">
          <p className="tabular font-display text-[3.5rem] leading-none font-medium text-ink">{r.percent}%</p>
          <p className={cn("mt-1 text-[15px] font-medium", tone)}>{r.grade}</p>
          <p className="tabular text-[13px] text-ink-3">
            {r.score} of {r.maxScore} points
          </p>
        </div>
      </header>

      {r.endState?.debrief ? (
        <p className="rounded-lg border-l-2 border-pine-3 bg-card px-5 py-4 font-display text-[1.15rem] leading-relaxed text-ink">
          {r.endState.debrief}
        </p>
      ) : null}

      <AiExplanation sessionId={r.id} initial={r.ai as never} />

      <section>
        <h2 className="mb-3 text-[17px] font-medium text-ink">Decision by decision</h2>
        <ol className="divide-y divide-rule-2 rounded-lg border border-rule bg-card">
          {r.decisions.map((d) => (
            <li key={d.id} className="grid gap-2 px-5 py-4 md:grid-cols-[56px_1fr_auto] md:gap-4">
              <span className="tabular font-mono text-[12px] text-ink-3 md:pt-0.5">{clock(d.elapsedMs)}</span>
              <div>
                <p className="text-[15px] font-medium text-ink">
                  {d.action}
                  {d.detail ? <span className="font-normal text-ink-3"> · {d.detail}</span> : null}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-3">{d.state}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{d.rationale}</p>
                {d.teaching ? (
                  <details className="mt-2 rounded-md bg-paper px-3 py-2 text-[14px]">
                    <summary className="inline-flex cursor-pointer items-center gap-1.5 text-pine-3">
                      <BookOpen className="size-3.5" /> {d.teaching.title}
                    </summary>
                    <p className="mt-2 leading-relaxed text-ink-2">{d.teaching.body}</p>
                    {d.teaching.reference ? <p className="mt-1 text-[12px] text-ink-3">{d.teaching.reference}</p> : null}
                  </details>
                ) : null}
              </div>
              <div className="flex items-start gap-3 md:flex-col md:items-end">
                <OutcomeTag outcome={d.outcome} />
                <span className={cn("tabular font-mono text-[12px]", d.points < 0 ? "text-tag-red" : "text-ink-3")}>
                  {d.points > 0 ? `+${d.points}` : d.points}
                </span>
              </div>
            </li>
          ))}
          {r.decisions.length === 0 ? <li className="px-5 py-6 text-[14px] text-ink-3">No decisions were made.</li> : null}
        </ol>
      </section>

      {r.missed.length ? (
        <section className="rounded-lg border border-tag-yellow/30 bg-tag-yellow-wash p-5">
          <h2 className="inline-flex items-center gap-2 text-[15px] font-medium text-ink">
            <AlertTriangle className="size-4 text-tag-yellow" /> Required steps this run didn&apos;t reach
          </h2>
          <ul className="mt-3 space-y-2 text-[14px] text-ink-2">
            {r.missed.map((m) => (
              <li key={m.action}>
                <span className="font-medium text-ink">{m.action}.</span> {m.rationale}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="flex flex-wrap gap-3 border-t border-rule pt-6">
        <ButtonLink href={`/app/scenarios/${r.scenario.id}`}>Run it again</ButtonLink>
        <ButtonLink href="/app/scenarios" variant="secondary">
          Back to the library
        </ButtonLink>
      </footer>
    </div>
  );
}
