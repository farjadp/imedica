"use client";

import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { StatusPill } from "@/components/app/page-header";
import { cn } from "@/lib/cn";

import { AssessmentBasicsForm } from "./basics-form";
import { AssessmentPublishTab } from "./publish-tab";
import { QuestionsTab } from "./questions-tab";
import type { EditorAssessment, ScenarioOption } from "./types";

const TABS = [
  { key: "basics", label: "Basics" },
  { key: "questions", label: "Quiz" },
  { key: "publish", label: "Review & publish" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function AssessmentEditor({
  assessment,
  scenarios,
  me,
  initialTab,
}: {
  assessment: EditorAssessment;
  scenarios: ScenarioOption[];
  me: { id: string; role: string };
  initialTab?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const tab = (TABS.find((t) => t.key === (params.get("tab") ?? initialTab))?.key ?? "basics") as TabKey;
  const locked = assessment.status !== "DRAFT";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <StatusPill status={assessment.status} />
            <span className="text-[13px] text-ink-3">
              {assessment.scenarioIds.length} scenario{assessment.scenarioIds.length === 1 ? "" : "s"} ·{" "}
              {assessment.questions.length} question{assessment.questions.length === 1 ? "" : "s"}
            </span>
          </div>
          <h1 className="mt-2 font-display text-[2rem] leading-tight font-medium tracking-[-0.015em] text-ink">
            {assessment.title}
          </h1>
        </div>
        {assessment.problems.length === 0 ? (
          <p className="inline-flex items-center gap-1.5 text-[13px] text-tag-green">
            <CheckCircle2 className="size-4" /> Ready for review
          </p>
        ) : (
          <button
            type="button"
            onClick={() => router.replace("?tab=publish", { scroll: false })}
            className="inline-flex items-center gap-1.5 text-[13px] text-tag-yellow hover:underline"
          >
            <AlertTriangle className="size-4" /> {assessment.problems.length} thing{assessment.problems.length > 1 ? "s" : ""} to
            finish before review
          </button>
        )}
      </header>

      {locked ? (
        <div className="flex items-start gap-3 rounded-md border border-rule bg-paper-2 px-4 py-3 text-[14px] text-ink-2">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p>
            {assessment.status === "ARCHIVED"
              ? "Archived. Restore it from Review & publish to edit again."
              : "Only drafts can be edited, so the reviewer publishes exactly what they checked and services compare like with like. Send it back to draft from Review & publish to make changes."}
          </p>
        </div>
      ) : null}

      <nav aria-label="Editor sections" className="-mx-1 flex gap-1 overflow-x-auto border-b border-rule">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => router.replace(`?tab=${t.key}`, { scroll: false })}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "relative -mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-[14px] whitespace-nowrap transition-colors",
              tab === t.key ? "border-signal text-ink" : "border-transparent text-ink-3 hover:text-ink",
            )}
          >
            {t.label}
            {t.key === "questions" ? (
              <span className="tabular rounded-full bg-paper-2 px-1.5 font-mono text-[11px] text-ink-3">
                {assessment.questions.length}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div>
        {tab === "basics" ? (
          <div className="max-w-3xl">
            <AssessmentBasicsForm initial={assessment} scenarios={scenarios} readOnly={locked} />
          </div>
        ) : null}
        {tab === "questions" ? <QuestionsTab assessment={assessment} locked={locked} /> : null}
        {tab === "publish" ? <AssessmentPublishTab assessment={assessment} scenarios={scenarios} me={me} /> : null}
      </div>
    </div>
  );
}
