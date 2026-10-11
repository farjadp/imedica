// Numbers for the profile, worked out from the runs the app already has.

import type { SessionSummary } from "./types";

export type TrainingStats = {
  runs: number;
  average: number | null;
  best: number | null;
  /** Consecutive days with a finished run, ending today or yesterday. */
  streak: number;
  /** Oldest to newest. */
  trend: number[];
  categories: Set<string>;
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function trainingStats(sessions: SessionSummary[], now = new Date()): TrainingStats {
  const done = sessions.filter((s) => s.status === "COMPLETED" || s.status === "TIMED_OUT");
  const percents = done.map((s) => s.percent);
  const days = new Set(done.map((s) => dayKey(new Date(s.startedAt))));

  let streak = 0;
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    runs: done.length,
    average: percents.length ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : null,
    best: percents.length ? Math.max(...percents) : null,
    streak,
    trend: [...done]
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
      .slice(-12)
      .map((s) => s.percent),
    categories: new Set(done.map((s) => s.scenario.category)),
  };
}
