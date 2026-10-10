import "server-only";

import type { CurrentUser } from "../auth/session";
import { db } from "../db";
import { scorePercent } from "../engine/rules";
import { anonymousHashFor } from "../privacy/deidentify";

/** Each published scenario with the learner's own best and latest result. */
export async function libraryFor(user: CurrentUser) {
  const [scenarios, runs] = await Promise.all([
    db.scenario.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ category: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        summary: true,
        category: true,
        difficulty: true,
        timeLimitSec: true,
        learningGoals: true,
        dispatch: true,
        protocolSource: true,
      },
    }),
    db.trainingSession.findMany({
      where: { anonymousHash: anonymousHashFor(user.id), status: { in: ["COMPLETED", "TIMED_OUT", "IN_PROGRESS"] } },
      orderBy: { startedAt: "desc" },
      select: { id: true, scenarioId: true, status: true, score: true, maxScore: true, startedAt: true },
    }),
  ]);

  return scenarios.map((s) => {
    const mine = runs.filter((r) => r.scenarioId === s.id);
    const finished = mine.filter((r) => r.status !== "IN_PROGRESS");
    const best = finished.length ? Math.max(...finished.map((r) => scorePercent(r.score, r.maxScore))) : null;
    const live = mine.find((r) => r.status === "IN_PROGRESS") ?? null;
    return { ...s, attempts: finished.length, best, liveSessionId: live?.id ?? null };
  });
}
