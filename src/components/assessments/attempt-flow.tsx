"use client";

import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Lock, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { categoryLabel } from "@/lib/labels";

export type AttemptData = {
  id: string;
  phase: "PRE" | "POST";
  open: boolean;
  completed: boolean;
  reveal: boolean;
  quizScorePct: number | null;
  assessment: { id: string; title: string; summary: string };
  quiz: {
    id: string;
    stem: string;
    options: string[];
    answer: number | null;
    correctIndex?: number;
    rationale?: string;
    reference?: string | null;
  }[];
  scenarios: {
    id: string;
    title: string;
    category: string;
    timeLimitSec: number;
    run: { id: string; status: string; percent: number | null } | null;
  }[];
};

export function AttemptFlow({ initial }: { initial: AttemptData }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number | null>>(
    Object.fromEntries(initial.quiz.map((q) => [q.id, q.answer])),
  );
  const firstUnanswered = initial.quiz.findIndex((q) => q.answer === null);
  const [index, setIndex] = useState(firstUnanswered === -1 ? 0 : firstUnanswered);
  const allAnswered = Object.values(answers).every((v) => v !== null);
  const [view, setView] = useState<"quiz" | "scenarios">(allAnswered || initial.completed ? "scenarios" : "quiz");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const editable = initial.open && !initial.completed;
  const q = initial.quiz[index];
  const scenariosDone = initial.scenarios.every((s) => s.run && s.run.status !== "IN_PROGRESS");

  async function choose(choice: number) {
    if (!editable) return;
    const previous = answers[q.id];
    setAnswers((a) => ({ ...a, [q.id]: choice }));
    setError(null);
    try {
      await api("POST", `/attempts/${initial.id}/answers`, { questionId: q.id, choice });
    } catch (err) {
      setAnswers((a) => ({ ...a, [q.id]: previous }));
      setError(err instanceof ApiError ? err.message : "Your answer didn't save. Try again.");
    }
  }

  async function run(scenarioId: string) {
    setPending(scenarioId);
    setError(null);
    try {
      const { id } = await api<{ id: string }>("POST", `/attempts/${initial.id}/runs`, { scenarioId });
      router.push(`/run/${id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      setPending(null);
    }
  }

  async function finish() {
    setPending("finish");
    setError(null);
    try {
      await api("POST", `/attempts/${initial.id}/finish`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setPending(null);
    }
  }

  const answeredCount = Object.values(answers).filter((v) => v !== null).length;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[13px] text-ink-3">{initial.phase === "PRE" ? "Before training" : "After training"}</p>
        <h1 className="font-display text-[2.2rem] leading-tight font-medium tracking-[-0.015em] text-ink">
          {initial.assessment.title}
        </h1>
        {initial.completed ? null : (
          <p className="max-w-2xl text-[15px] text-ink-2">
            {initial.quiz.length} questions, then each scenario once. No answers or debriefs until you&apos;ve done the
            after-training round, so this is a fair picture of where you start. Your service only sees team totals.
          </p>
        )}
      </header>

      {initial.completed ? <Done data={initial} /> : null}
      {!initial.open && !initial.completed ? (
        <p className="flex items-center gap-2 rounded-md border border-rule bg-paper-2 px-4 py-3 text-[14px] text-ink-2">
          <Lock className="size-4" /> This assessment has closed.
        </p>
      ) : null}

      <nav aria-label="Assessment steps" className="flex gap-1 border-b border-rule">
        {(
          [
            ["quiz", `Quiz · ${answeredCount}/${initial.quiz.length}`],
            [
              "scenarios",
              `Scenarios · ${initial.scenarios.filter((s) => s.run && s.run.status !== "IN_PROGRESS").length}/${initial.scenarios.length}`,
            ],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            aria-current={view === key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-[14px] whitespace-nowrap transition-colors",
              view === key ? "border-signal text-ink" : "border-transparent text-ink-3 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      <FormError message={error} />

      {view === "quiz" && q ? (
        <section aria-labelledby="question" className="space-y-5">
          <p className="tabular font-mono text-[12px] text-ink-3">
            Question {index + 1} of {initial.quiz.length}
          </p>
          <h2 id="question" className="text-[20px] leading-snug font-medium text-ink">
            {q.stem}
          </h2>
          <ul className="space-y-2" role="radiogroup" aria-labelledby="question">
            {q.options.map((o, i) => {
              const chosen = answers[q.id] === i;
              const right = initial.reveal && q.correctIndex === i;
              const wrong = initial.reveal && chosen && q.correctIndex !== i;
              return (
                <li key={i}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={chosen}
                    disabled={!editable}
                    onClick={() => choose(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3.5 text-left text-[15px] transition-colors",
                      chosen ? "border-pine-3 bg-pine-wash text-ink" : "border-rule text-ink-2",
                      editable && !chosen && "hover:border-ink-3/60 hover:text-ink",
                      right && "border-tag-green bg-tag-green-wash text-ink",
                      wrong && "border-tag-red bg-tag-red-wash",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border",
                        chosen ? "border-pine-3 bg-pine-3 text-paper" : "border-rule",
                      )}
                    >
                      {right ? (
                        <Check className="size-3" />
                      ) : wrong ? (
                        <X className="size-3" />
                      ) : chosen ? (
                        <span className="size-1.5 rounded-full bg-paper" />
                      ) : null}
                    </span>
                    {o}
                  </button>
                </li>
              );
            })}
          </ul>
          {initial.reveal && q.rationale ? (
            <div className="rounded-md border border-rule bg-paper-2 px-4 py-3 text-[14px] leading-relaxed text-ink-2">
              {q.rationale}
              {q.reference ? <p className="mt-1 text-[12px] text-ink-3">{q.reference}</p> : null}
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button variant="ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            {index < initial.quiz.length - 1 ? (
              <Button variant="secondary" onClick={() => setIndex(index + 1)}>
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={() => setView("scenarios")} disabled={editable && !allAnswered}>
                On to the scenarios <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </section>
      ) : null}

      {view === "scenarios" ? (
        <section className="space-y-4">
          <ol className="divide-y divide-rule-2 rounded-lg border border-rule bg-card">
            {initial.scenarios.map((s, i) => {
              const done = s.run && s.run.status !== "IN_PROGRESS";
              return (
                <li key={s.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <span className="tabular font-mono text-[12px] text-ink-3">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-ink">{s.title}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-3">
                      {categoryLabel[s.category]} <Clock className="size-3.5" /> {Math.round(s.timeLimitSec / 60)} min
                    </p>
                  </div>
                  {done ? (
                    initial.reveal ? (
                      <Link href={`/app/review/${s.run!.id}`} className="text-[14px] text-pine-3 hover:underline">
                        {s.run!.percent}% · debrief
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[14px] text-tag-green">
                        <CheckCircle2 className="size-4" /> Done
                      </span>
                    )
                  ) : editable ? (
                    <Button
                      size="sm"
                      variant={s.run ? "secondary" : "primary"}
                      pending={pending === s.id}
                      onClick={() => run(s.id)}
                    >
                      {s.run ? "Return to the call" : "Start the call"}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ol>

          {editable ? (
            <div className="flex flex-col gap-3 rounded-lg border border-rule bg-paper-2 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[14px] text-ink-2">
                {!allAnswered
                  ? `Answer the remaining ${initial.quiz.length - answeredCount} question${initial.quiz.length - answeredCount === 1 ? "" : "s"} first.`
                  : !scenariosDone
                    ? "Run every scenario, then hand it in."
                    : "Everything's done. Hand it in to finish."}
              </p>
              <Button disabled={!allAnswered || !scenariosDone} pending={pending === "finish"} onClick={finish}>
                Hand it in
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Done({ data }: { data: AttemptData }) {
  if (!data.reveal) {
    return (
      <div className="rounded-lg border border-pine-3/30 bg-pine-wash p-5">
        <p className="text-[15px] font-medium text-ink">Handed in. Thank you.</p>
        <p className="mt-1 text-[14px] text-ink-2">
          Your answers and debriefs open after the after-training round. Until then, the scenario library is yours to practise in.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-tag-green/30 bg-tag-green-wash p-5">
      <p className="text-[15px] font-medium text-ink">Handed in. Your results are open.</p>
      <p className="mt-1 text-[14px] text-ink-2">
        Quiz: {data.quizScorePct ?? 0}% correct. Each scenario links to its debrief below, and the quiz shows the right answers
        with the reasons.
      </p>
    </div>
  );
}
