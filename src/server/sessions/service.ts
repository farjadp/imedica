import "server-only";
import { after } from "next/server";
import { z } from "zod";

import { generateExplanation } from "../ai/feedback";
import { HttpError } from "../auth/guards";
import type { CurrentUser } from "../auth/session";
import { db } from "../db";
import { type EngineRule, evaluate, grade, maxScore, missedRequired, scorePercent } from "../engine/rules";
import { anonymousHashFor, cohortKeyFor, projectSessionToAnalytics } from "../privacy/deidentify";

// ============================================================================
// Training runs. A run is owned by an anonymous hash; ownership is checked by
// recomputing the hash from the signed-in user, never by storing a user id.
// ============================================================================

const decideSchema = z.object({ actionId: z.string().min(1) });

async function ownedSession(user: CurrentUser, sessionId: string) {
  const session = await db.trainingSession.findUnique({ where: { id: sessionId } });
  // Someone else's run looks exactly like a missing one.
  if (!session || session.anonymousHash !== anonymousHashFor(user.id)) throw new HttpError(404, "Run not found.");
  return session;
}

function engineRules(rules: EngineRule[]): EngineRule[] {
  return rules.map((r) => ({
    id: r.id,
    fromStateId: r.fromStateId,
    actionId: r.actionId,
    outcome: r.outcome,
    points: r.points,
    toStateId: r.toStateId,
    withinSec: r.withinSec,
    priority: r.priority,
    required: r.required,
  }));
}

export async function startSession(user: CurrentUser, scenarioId: string) {
  const scenario = await db.scenario.findUnique({
    where: { id: scenarioId },
    include: { states: { where: { isStart: true }, take: 1 }, rules: true },
  });
  if (!scenario || scenario.status !== "PUBLISHED") throw new HttpError(404, "Scenario not found.");
  const start = scenario.states[0];
  if (!start) throw new HttpError(409, "This scenario has no starting state yet.");

  const anonymousHash = anonymousHashFor(user.id);
  // One live run per scenario: starting again abandons the previous attempt.
  await db.trainingSession.updateMany({
    where: { anonymousHash, scenarioId, status: "IN_PROGRESS" },
    data: { status: "ABANDONED", endedAt: new Date() },
  });

  return db.trainingSession.create({
    data: {
      scenarioId,
      anonymousHash,
      cohortKey: cohortKeyFor(user.organizationId),
      currentStateId: start.id,
      maxScore: maxScore(engineRules(scenario.rules)),
    },
    select: { id: true },
  });
}

/** What the runtime screen needs: no rules, no rationale, nothing that gives answers away. */
export async function getRuntime(user: CurrentUser, sessionId: string) {
  const session = await ownedSession(user, sessionId);
  const scenario = await db.scenario.findUniqueOrThrow({
    where: { id: session.scenarioId },
    select: {
      id: true,
      title: true,
      dispatch: true,
      category: true,
      timeLimitSec: true,
      actions: { orderBy: [{ category: "asc" }, { order: "asc" }], select: { id: true, category: true, label: true, detail: true } },
    },
  });
  const state = session.currentStateId
    ? await db.scenarioState.findUnique({
        where: { id: session.currentStateId },
        select: { id: true, title: true, narrative: true, vitals: true, isTerminal: true },
      })
    : null;
  const decisions = await db.sessionDecision.findMany({
    where: { sessionId },
    orderBy: { elapsedMs: "asc" },
    select: { id: true, actionId: true, outcome: true, elapsedMs: true },
  });

  return {
    id: session.id,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    serverNow: new Date().toISOString(),
    scenario,
    state,
    decisions,
  };
}

export async function decide(user: CurrentUser, sessionId: string, body: unknown) {
  const { actionId } = decideSchema.parse(body);
  const session = await ownedSession(user, sessionId);
  if (session.status !== "IN_PROGRESS" || !session.currentStateId) {
    throw new HttpError(409, "This run has already ended.");
  }

  const now = new Date();
  const elapsedMs = now.getTime() - session.startedAt.getTime();
  const scenario = await db.scenario.findUniqueOrThrow({
    where: { id: session.scenarioId },
    select: {
      timeLimitSec: true,
      rules: true,
      states: { where: { isTerminal: true }, select: { id: true } },
      actions: { where: { id: actionId }, select: { id: true } },
    },
  });
  if (!scenario.actions.length) throw new HttpError(422, "That action isn't on this scenario's menu.");

  if (elapsedMs > scenario.timeLimitSec * 1000) {
    await finish(user, sessionId, "TIMED_OUT");
    throw new HttpError(409, "Time's up. The run has ended.");
  }

  const fired = await db.sessionDecision.findMany({
    where: { sessionId, ruleId: { not: null } },
    select: { ruleId: true },
  });
  const verdict = evaluate({
    rules: engineRules(scenario.rules),
    stateId: session.currentStateId,
    actionId,
    secondsInState: Math.floor((now.getTime() - session.stateEnteredAt.getTime()) / 1000),
    firedRuleIds: new Set(fired.map((f) => f.ruleId!)),
    terminalStateIds: new Set(scenario.states.map((s) => s.id)),
  });

  const stateChanged = verdict.nextStateId !== session.currentStateId;
  await db.$transaction([
    db.sessionDecision.create({
      data: {
        sessionId,
        actionId,
        stateId: session.currentStateId,
        ruleId: verdict.ruleId,
        outcome: verdict.outcome,
        points: verdict.points,
        elapsedMs,
      },
    }),
    db.trainingSession.update({
      where: { id: sessionId },
      data: {
        score: { increment: verdict.points },
        currentStateId: verdict.nextStateId,
        ...(stateChanged ? { stateEnteredAt: now } : {}),
      },
    }),
  ]);

  if (verdict.endsScenario) await finish(user, sessionId, "COMPLETED");

  return {
    outcome: verdict.outcome,
    late: verdict.late,
    repeated: verdict.repeated,
    ended: verdict.endsScenario,
  };
}

export async function endSession(user: CurrentUser, sessionId: string) {
  const session = await ownedSession(user, sessionId);
  if (session.status !== "IN_PROGRESS") return { status: session.status };
  const scenario = await db.scenario.findUniqueOrThrow({ where: { id: session.scenarioId }, select: { timeLimitSec: true } });
  const over = Date.now() - session.startedAt.getTime() > scenario.timeLimitSec * 1000;
  await finish(user, sessionId, over ? "TIMED_OUT" : "COMPLETED");
  return { status: over ? "TIMED_OUT" : "COMPLETED" };
}

async function finish(user: CurrentUser, sessionId: string, status: "COMPLETED" | "TIMED_OUT") {
  const result = await db.trainingSession.updateMany({
    where: { id: sessionId, status: "IN_PROGRESS" },
    data: { status, endedAt: new Date() },
  });
  if (result.count === 0) return; // someone else already finished it

  await projectSessionToAnalytics(sessionId, { level: user.level, yearsExperience: user.yearsExperience });
  await db.aiFeedback.create({ data: { sessionId } });
  // Respond first; write the explanation after the response is sent.
  after(() => generateExplanation(sessionId));
}

// ─── Review ─────────────────────────────────────────────────────────────────

export async function getReview(user: CurrentUser, sessionId: string) {
  const session = await ownedSession(user, sessionId);
  if (session.status === "IN_PROGRESS") throw new HttpError(409, "Finish the run to see the debrief.");

  const scenario = await db.scenario.findUniqueOrThrow({
    where: { id: session.scenarioId },
    include: {
      actions: true,
      states: true,
      rules: { include: { feedback: true, action: true } },
    },
  });
  const decisions = await db.sessionDecision.findMany({ where: { sessionId }, orderBy: { elapsedMs: "asc" } });
  const ai = await db.aiFeedback.findUnique({ where: { sessionId } });

  const actionById = new Map(scenario.actions.map((a) => [a.id, a]));
  const stateById = new Map(scenario.states.map((s) => [s.id, s]));
  const ruleById = new Map(scenario.rules.map((r) => [r.id, r]));
  const firedIds = new Set(decisions.map((d) => d.ruleId).filter((v): v is string => Boolean(v)));

  const pct = scorePercent(session.score, session.maxScore);
  const harmful = decisions.filter((d) => d.outcome === "HARMFUL" || d.outcome === "CRITICAL").length;
  const endState = session.currentStateId ? stateById.get(session.currentStateId) : null;

  return {
    id: session.id,
    status: session.status,
    scenario: { id: scenario.id, title: scenario.title, category: scenario.category, protocolSource: scenario.protocolSource },
    startedAt: session.startedAt.toISOString(),
    durationSec: session.endedAt ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000) : 0,
    score: Math.max(0, session.score),
    maxScore: session.maxScore,
    percent: pct,
    grade: grade(pct, harmful),
    endState: endState ? { title: endState.title, debrief: endState.debrief } : null,
    decisions: decisions.map((d) => {
      const rule = d.ruleId ? ruleById.get(d.ruleId) : null;
      return {
        id: d.id,
        elapsedMs: d.elapsedMs,
        outcome: d.outcome,
        points: d.points,
        action: actionById.get(d.actionId)?.label ?? "Unknown action",
        detail: actionById.get(d.actionId)?.detail ?? null,
        state: stateById.get(d.stateId)?.title ?? "",
        rationale: rule?.rationale ?? "This action isn't indicated at this point in the call.",
        teaching: rule?.feedback ? { title: rule.feedback.title, body: rule.feedback.body, reference: rule.feedback.reference } : null,
      };
    }),
    missed: missedRequired(engineRules(scenario.rules), firedIds).map((r) => {
      const full = ruleById.get(r.id)!;
      return { action: full.action.label, rationale: full.rationale };
    }),
    ai: ai ? { status: ai.status, content: ai.status === "READY" ? ai.content : null, review: ai.review } : null,
  };
}

export async function getAiStatus(user: CurrentUser, sessionId: string) {
  await ownedSession(user, sessionId);
  const ai = await db.aiFeedback.findUnique({ where: { sessionId } });
  return ai ? { status: ai.status, content: ai.status === "READY" ? ai.content : null } : { status: "PENDING", content: null };
}

export async function listMySessions(user: CurrentUser, take = 20) {
  const sessions = await db.trainingSession.findMany({
    where: { anonymousHash: anonymousHashFor(user.id), status: { not: "ABANDONED" } },
    orderBy: { startedAt: "desc" },
    take,
    include: { scenario: { select: { id: true, title: true, category: true } } },
  });
  return sessions.map((s) => ({
    id: s.id,
    status: s.status,
    startedAt: s.startedAt.toISOString(),
    percent: scorePercent(s.score, s.maxScore),
    scenario: s.scenario,
  }));
}
