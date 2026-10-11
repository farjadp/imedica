import "server-only";

import { HttpError, ORG_MANAGER_ROLES, scopeOrganization } from "../auth/guards";
import type { CurrentUser } from "../auth/session";
import { db } from "../db";
import { scorePercent } from "../engine/rules";
import { cohortKeyFor } from "../privacy/deidentify";
import { K_ANONYMITY } from "../privacy/hash";
import { pairedChange } from "./score";

// ============================================================================
// The pilot's before/after report for one service and one assessment. Pairs
// people by anonymous hash, compares only those who finished both rounds, and
// withholds any figure behind fewer than K_ANONYMITY people. No hash, no
// individual result ever leaves this function.
// ============================================================================

export const TARGET_IMPROVEMENT_PCT = 15;

type Change = ReturnType<typeof pairedChange>;
type Guarded = { suppressed: true; people: number } | ({ suppressed: false } & Change);

function guard(change: Change): Guarded {
  if (change.people < K_ANONYMITY) return { suppressed: true, people: Math.min(change.people, K_ANONYMITY - 1) };
  return { suppressed: false, ...change };
}

export async function assessmentReport(user: CurrentUser, assessmentId: string, requestedOrgId?: string | null) {
  if (!ORG_MANAGER_ROLES.includes(user.role)) throw new HttpError(403, "Only training leads can see assessment results.");
  const orgId = scopeOrganization(user, requestedOrgId);
  if (!orgId) throw new HttpError(400, "Choose an organization.");

  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, title: true, scenarioIds: true },
  });
  if (!assessment) throw new HttpError(404, "Assessment not found.");

  const attempts = await db.assessmentAttempt.findMany({
    where: { assessmentId, cohortKey: cohortKeyFor(orgId), completedAt: { not: null } },
    orderBy: { completedAt: "asc" },
    select: { id: true, phase: true, anonymousHash: true, quizScorePct: true },
  });
  const runs = await db.trainingSession.findMany({
    where: { attemptId: { in: attempts.map((a) => a.id) }, status: { in: ["COMPLETED", "TIMED_OUT"] } },
    select: { attemptId: true, scenarioId: true, score: true, maxScore: true },
  });

  const byPhase = (phase: "PRE" | "POST") => attempts.filter((a) => a.phase === phase);
  const runsOf = (attemptId: string) => runs.filter((r) => r.attemptId === attemptId);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  // Each person's mean scenario score in a round.
  const scenarioPoints = (phase: "PRE" | "POST") =>
    byPhase(phase).flatMap((a) => {
      const mine = runsOf(a.id);
      return mine.length ? [{ who: a.anonymousHash, value: avg(mine.map((r) => scorePercent(r.score, r.maxScore))) }] : [];
    });
  const quizPoints = (phase: "PRE" | "POST") =>
    byPhase(phase).flatMap((a) => (a.quizScorePct === null ? [] : [{ who: a.anonymousHash, value: a.quizScorePct }]));
  const onePoints = (phase: "PRE" | "POST", scenarioId: string) =>
    byPhase(phase).flatMap((a) => {
      const run = runsOf(a.id).find((r) => r.scenarioId === scenarioId);
      return run ? [{ who: a.anonymousHash, value: scorePercent(run.score, run.maxScore) }] : [];
    });

  const scenarios = await db.scenario.findMany({
    where: { id: { in: assessment.scenarioIds } },
    select: { id: true, title: true },
  });
  const scenarioChange = guard(pairedChange(scenarioPoints("PRE"), scenarioPoints("POST")));

  return {
    assessment: { id: assessment.id, title: assessment.title },
    organizationId: orgId,
    kAnonymity: K_ANONYMITY,
    targetImprovementPct: TARGET_IMPROVEMENT_PCT,
    finished: { pre: guardCount(byPhase("PRE").length), post: guardCount(byPhase("POST").length) },
    scenarios: scenarioChange,
    quiz: guard(pairedChange(quizPoints("PRE"), quizPoints("POST"))),
    byScenario: assessment.scenarioIds.map((id) => ({
      id,
      title: scenarios.find((s) => s.id === id)?.title ?? "Scenario",
      ...guard(pairedChange(onePoints("PRE", id), onePoints("POST", id))),
    })),
    metTarget:
      scenarioChange.suppressed || scenarioChange.relativePct === null
        ? null
        : scenarioChange.relativePct >= TARGET_IMPROVEMENT_PCT,
    note: "The same scenarios and questions were used before and after training, so part of any gain can come from having seen them before.",
  };
}

function guardCount(n: number) {
  return n >= K_ANONYMITY ? { count: n, suppressed: false as const } : { count: null, suppressed: true as const };
}
