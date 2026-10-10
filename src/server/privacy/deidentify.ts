import "server-only";

import type { ParamedicLevel } from "@/generated/prisma/enums";

import { db } from "../db";
import { env } from "../env";
import { experienceBucket, keyedHash, weekStart } from "./hash";

// ============================================================================
// The only bridge between the identity schema and the content/analytics
// schemas. Everything else in the app talks about people through these hashes.
// ============================================================================

export function anonymousHashFor(userId: string): string {
  return keyedHash(env().DEIDENTIFICATION_SECRET, "user", userId);
}

export function cohortKeyFor(organizationId: string | null | undefined): string | null {
  return organizationId ? keyedHash(env().DEIDENTIFICATION_SECRET, "cohort", organizationId) : null;
}

/**
 * Writes the de-identified copy of a finished training session to the
 * analytics schema. Called once per session, when it ends.
 */
export async function projectSessionToAnalytics(sessionId: string, profile: {
  level: ParamedicLevel | null;
  yearsExperience: number | null;
}) {
  const session = await db.trainingSession.findUnique({
    where: { id: sessionId },
    include: {
      scenario: { select: { category: true, difficulty: true } },
      decisions: { orderBy: { elapsedMs: "asc" } },
    },
  });
  if (!session || !session.endedAt) return;

  const missedRequired = await countMissedRequired(session.scenarioId, session.decisions.map((d) => d.ruleId));

  // Seconds since the previous decision: how long the paramedic took to act.
  let previousMs = 0;
  const decisions = session.decisions.map((d) => {
    const secondsInState = Math.max(0, Math.round((d.elapsedMs - previousMs) / 1000));
    previousMs = d.elapsedMs;
    return { outcome: d.outcome, secondsInState, actionId: d.actionId };
  });

  const actions = await db.scenarioAction.findMany({
    where: { id: { in: decisions.map((d) => d.actionId) } },
    select: { id: true, category: true },
  });
  const categoryById = new Map(actions.map((a) => [a.id, a.category]));

  await db.analyticsSession.create({
    data: {
      anonymousHash: session.anonymousHash,
      cohortKey: session.cohortKey,
      scenarioId: session.scenarioId,
      category: session.scenario.category,
      difficulty: session.scenario.difficulty,
      level: profile.level,
      experienceBucket: experienceBucket(profile.yearsExperience),
      scorePct: session.maxScore > 0 ? Math.round((Math.max(0, session.score) / session.maxScore) * 100) : 0,
      durationSec: Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000),
      outcome: session.status,
      harmfulCount: session.decisions.filter((d) => d.outcome === "HARMFUL" || d.outcome === "CRITICAL").length,
      missedRequired,
      completedWeek: weekStart(session.endedAt),
      decisions: {
        create: decisions
          .filter((d) => categoryById.has(d.actionId))
          .map((d) => ({
            actionCategory: categoryById.get(d.actionId)!,
            outcome: d.outcome,
            secondsInState: d.secondsInState,
          })),
      },
    },
  });
}

async function countMissedRequired(scenarioId: string, firedRuleIds: (string | null)[]) {
  const required = await db.scenarioRule.findMany({
    where: { scenarioId, required: true },
    select: { id: true },
  });
  const fired = new Set(firedRuleIds.filter(Boolean));
  return required.filter((r) => !fired.has(r.id)).length;
}
