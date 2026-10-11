"use client";

import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { StatusPill } from "@/components/app/page-header";
import { cn } from "@/lib/cn";
import { categoryLabel, difficultyLabel } from "@/lib/labels";

import { ActionsTab } from "./actions-tab";
import { BasicsForm } from "./basics-form";
import { FeedbackTab } from "./feedback-tab";
import { PublishTab } from "./publish-tab";
import { RulesTab } from "./rules-tab";
import { StatesTab } from "./states-tab";
import type { EditorScenario } from "./types";

const TABS = [
  { key: "basics", label: "Basics" },
  { key: "states", label: "States" },
  { key: "actions", label: "Action menu" },
  { key: "rules", label: "Rules" },
  { key: "feedback", label: "Teaching notes" },
  { key: "publish", label: "Review & publish" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function ScenarioEditor({
  scenario,
  me,
  initialTab,
}: {
  scenario: EditorScenario;
  me: { id: string; role: string };
  initialTab?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const tab = (TABS.find((t) => t.key === (params.get("tab") ?? initialTab))?.key ?? "basics") as TabKey;
  const locked = scenario.status !== "DRAFT";

  const counts: Partial<Record<TabKey, number>> = {
    states: scenario.states.length,
    actions: scenario.actions.length,
    rules: scenario.rules.length,
    feedback: scenario.feedback.length,
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <StatusPill status={scenario.status} />
            <span className="text-[13px] text-ink-3">
              {categoryLabel[scenario.category]} · {difficultyLabel[scenario.difficulty]} ·{" "}
              {Math.round(scenario.timeLimitSec / 60)} min
            </span>
          </div>
          <h1 className="mt-2 font-display text-[2rem] leading-tight font-medium tracking-[-0.015em] text-ink">
            {scenario.title}
          </h1>
        </div>
        {scenario.problems.length === 0 ? (
          <p className="inline-flex items-center gap-1.5 text-[13px] text-tag-green">
            <CheckCircle2 className="size-4" /> Ready for review
          </p>
        ) : (
          <button
            type="button"
            onClick={() => router.replace("?tab=publish", { scroll: false })}
            className="inline-flex items-center gap-1.5 text-[13px] text-tag-yellow hover:underline"
          >
            <AlertTriangle className="size-4" /> {scenario.problems.length} thing{scenario.problems.length > 1 ? "s" : ""} to
            finish before review
          </button>
        )}
      </header>

      {locked ? (
        <div className="flex items-start gap-3 rounded-md border border-rule bg-paper-2 px-4 py-3 text-[14px] text-ink-2">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p>
            {scenario.status === "PUBLISHED"
              ? "Published scenarios are locked so learners never see a half-finished edit. Unpublish it from Review & publish to make changes."
              : scenario.status === "IN_REVIEW"
                ? "In review, so the reviewer publishes exactly what they checked. Send it back to draft from Review & publish to make changes."
                : "Archived. Restore it from Review & publish to edit again."}
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
            {counts[t.key] !== undefined ? (
              <span className="tabular rounded-full bg-paper-2 px-1.5 font-mono text-[11px] text-ink-3">{counts[t.key]}</span>
            ) : null}
          </button>
        ))}
      </nav>

      <div>
        {tab === "basics" ? <div className="max-w-3xl"><BasicsForm initial={scenario} readOnly={locked} /></div> : null}
        {tab === "states" ? <StatesTab scenario={scenario} locked={locked} /> : null}
        {tab === "actions" ? <ActionsTab scenario={scenario} locked={locked} /> : null}
        {tab === "rules" ? <RulesTab scenario={scenario} locked={locked} /> : null}
        {tab === "feedback" ? <FeedbackTab scenario={scenario} locked={locked} /> : null}
        {tab === "publish" ? <PublishTab scenario={scenario} me={me} /> : null}
      </div>
    </div>
  );
}
