import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { answerSchema } from "@/lib/validators/assessment";

import { audit } from "../audit";
import { HttpError } from "../auth/guards";
import type { CurrentUser } from "../auth/session";
import { db } from "../db";
import { scorePercent } from "../engine/rules";
import { anonymousHashFor, cohortKeyFor } from "../privacy/deidentify";
import { startSession } from "../sessions/service";
import { quizScore } from "./score";
import { isOpen } from "./windows";

// ============================================================================
// Taking an assessment. An attempt belongs to an anonymous hash, like a run,
// and is checked by recomputing the hash from the signed-in user. The quiz
// never leaves the server with its answers until the post-test is finished.
// ============================================================================

type Answers = Record<string, number>;

/** Windows open for the person's own service, with how far they've got in each. */
export async function myAssessments(user: CurrentUser) {
  if (!user.organizationId) return [];
  const now = new Date();
  const windows = await db.assessmentWindow.findMany({
    where: { organizationId: user.organizationId, opensAt: { lte: now }, OR: [{ closesAt: null }, { closesAt: { gt: now } }] },
    orderBy: { opensAt: "desc" },
  });
  if (!windows.length) return [];

  const hash = anonymousHashFor(user.id);
  const [assessments, attempts] = await Promise.all([
    db.assessment.findMany({
      where: { id: { in: windows.map((w) => w.assessmentId) }, status: "PUBLISHED" },
      select: { id: true, title: true, summary: true, scenarioIds: true, _count: { select: { questions: true } } },
    }),
    db.assessmentAttempt.findMany({
      where: { windowId: { in: windows.map((w) => w.id) }, anonymousHash: hash },
      select: { id: true, windowId: true, completedAt: true },
    }),
  ]);

  return windows.flatMap((w) => {
    const a = assessments.find((x) => x.id === w.assessmentId);
    if (!a) return [];
    const attempt = attempts.find((x) => x.windowId === w.id);
    return [
      {
        windowId: w.id,
        phase: w.phase as "PRE" | "POST",
        assessment: {
          id: a.id,
          title: a.title,
          summary: a.summary,
          scenarioCount: a.scenarioIds.length,
          questionCount: a._count.questions,
        },
        attemptId: attempt?.id ?? null,
        completed: Boolean(attempt?.completedAt),
      },
    ];
  });
}

async function openWindowFor(user: CurrentUser, windowId: string) {
  const window = await db.assessmentWindow.findUnique({ where: { id: windowId } });
  // A window for another service looks exactly like a missing one.
  if (!window || !user.organizationId || window.organizationId !== user.organizationId) {
    throw new HttpError(404, "Assessment not found.");
  }
  if (!isOpen(window)) throw new HttpError(409, "This assessment is closed.");
  return window;
}

/** Starts (or resumes) the person's attempt in a window. One per person per window. */
export async function startAttempt(user: CurrentUser, windowId: string) {
  const window = await openWindowFor(user, windowId);
  const assessment = await db.assessment.findUnique({ where: { id: window.assessmentId }, select: { status: true } });
  if (!assessment || assessment.status !== "PUBLISHED") throw new HttpError(404, "Assessment not found.");

  const anonymousHash = anonymousHashFor(user.id);
  const existing = await db.assessmentAttempt.findUnique({ where: { windowId_anonymousHash: { windowId, anonymousHash } } });
  if (existing) return { id: existing.id };

  const attempt = await db.assessmentAttempt.create({
    data: {
      windowId,
      assessmentId: window.assessmentId,
      phase: window.phase as "PRE" | "POST",
      anonymousHash,
      cohortKey: cohortKeyFor(user.organizationId),
    },
    select: { id: true },
  });
  // The audit names the assessment, never the attempt: that would tie a person to their scores.
  await audit(user, "assessment.start", { type: "Assessment", id: window.assessmentId }, { phase: window.phase });
  return attempt;
}

async function ownedAttempt(user: CurrentUser, attemptId: string) {
  const attempt = await db.assessmentAttempt.findUnique({ where: { id: attemptId } });
  // Someone else's attempt looks exactly like a missing one.
  if (!attempt || attempt.anonymousHash !== anonymousHashFor(user.id)) throw new HttpError(404, "Assessment not found.");
  return attempt;
}

async function postTestDone(user: CurrentUser, assessmentId: string) {
  const n = await db.assessmentAttempt.count({
    where: { assessmentId, anonymousHash: anonymousHashFor(user.id), phase: "POST", completedAt: { not: null } },
  });
  return n > 0;
}

/** The attempt as the person sees it: questions without answers, and each scenario's run. */
export async function getAttempt(user: CurrentUser, attemptId: string) {
  const attempt = await ownedAttempt(user, attemptId);
  const [assessment, window, runs] = await Promise.all([
    db.assessment.findUniqueOrThrow({
      where: { id: attempt.assessmentId },
      include: { questions: { orderBy: { order: "asc" } } },
    }),
    db.assessmentWindow.findUnique({ where: { id: attempt.windowId } }),
    db.trainingSession.findMany({
      where: { attemptId, status: { not: "ABANDONED" } },
      orderBy: { startedAt: "desc" },
      select: { id: true, scenarioId: true, status: true, score: true, maxScore: true },
    }),
  ]);
  const scenarios = await db.scenario.findMany({
    where: { id: { in: assessment.scenarioIds } },
    select: { id: true, title: true, category: true, timeLimitSec: true, status: true },
  });
  const reveal = await postTestDone(user, assessment.id);
  const answers = attempt.answers as Answers;

  return {
    id: attempt.id,
    phase: attempt.phase,
    open: window ? isOpen(window) : false,
    completed: Boolean(attempt.completedAt),
    assessment: { id: assessment.id, title: assessment.title, summary: assessment.summary },
    quiz: assessment.questions.map((q) => ({
      id: q.id,
      stem: q.stem,
      options: q.options,
      answer: answers[q.id] ?? null,
      // Answers and rationales only once the post-test is done.
      ...(reveal ? { correctIndex: q.correctIndex, rationale: q.rationale, reference: q.reference } : {}),
    })),
    quizScorePct: reveal ? attempt.quizScorePct : null,
    scenarios: assessment.scenarioIds.flatMap((id) => {
      const s = scenarios.find((x) => x.id === id);
      if (!s) return [];
      const run = runs.find((r) => r.scenarioId === id) ?? null;
      return [
        {
          id: s.id,
          title: s.title,
          category: s.category,
          timeLimitSec: s.timeLimitSec,
          run: run
            ? {
                id: run.id,
                status: run.status,
                percent: reveal && run.status !== "IN_PROGRESS" ? scorePercent(run.score, run.maxScore) : null,
              }
            : null,
        },
      ];
    }),
    reveal,
  };
}

async function assertActive(attempt: { completedAt: Date | null; windowId: string }) {
  if (attempt.completedAt) throw new HttpError(409, "You've already finished this assessment.");
  const window = await db.assessmentWindow.findUnique({ where: { id: attempt.windowId } });
  if (!window || !isOpen(window)) throw new HttpError(409, "This assessment is closed.");
}

export async function answerQuestion(user: CurrentUser, attemptId: string, body: unknown) {
  const { questionId, choice } = answerSchema.parse(body);
  const attempt = await ownedAttempt(user, attemptId);
  await assertActive(attempt);

  const question = await db.assessmentQuestion.findFirst({
    where: { id: questionId, assessmentId: attempt.assessmentId },
    select: { options: true },
  });
  if (!question) throw new HttpError(422, "That question isn't part of this assessment.");
  if (choice >= question.options.length) throw new HttpError(422, "Choose one of the options.");

  const answers = { ...(attempt.answers as Answers), [questionId]: choice };
  await db.assessmentAttempt.update({ where: { id: attemptId }, data: { answers: answers as Prisma.InputJsonValue } });
  return { answered: Object.keys(answers).length };
}

/** One run per scenario per attempt. A run that was abandoned may be started again. */
export async function startAssessmentRun(user: CurrentUser, attemptId: string, scenarioId: string) {
  const attempt = await ownedAttempt(user, attemptId);
  await assertActive(attempt);
  const assessment = await db.assessment.findUniqueOrThrow({
    where: { id: attempt.assessmentId },
    select: { scenarioIds: true },
  });
  if (!assessment.scenarioIds.includes(scenarioId)) throw new HttpError(422, "That scenario isn't part of this assessment.");

  const runs = await db.trainingSession.findMany({ where: { attemptId, scenarioId, status: { not: "ABANDONED" } } });
  const live = runs.find((r) => r.status === "IN_PROGRESS");
  if (live) return { id: live.id };
  if (runs.length) throw new HttpError(409, "You've already run this scenario for the assessment.");
  return startSession(user, scenarioId, { attemptId });
}

export async function finishAttempt(user: CurrentUser, attemptId: string) {
  const attempt = await ownedAttempt(user, attemptId);
  await assertActive(attempt);
  const assessment = await db.assessment.findUniqueOrThrow({
    where: { id: attempt.assessmentId },
    include: { questions: { select: { id: true, correctIndex: true } } },
  });

  const answers = attempt.answers as Answers;
  const unanswered = assessment.questions.filter((q) => answers[q.id] === undefined).length;
  if (unanswered) throw new HttpError(409, `Answer every question first (${unanswered} left).`);

  const finished = await db.trainingSession.findMany({
    where: { attemptId, status: { in: ["COMPLETED", "TIMED_OUT"] } },
    select: { scenarioId: true },
  });
  const done = new Set(finished.map((r) => r.scenarioId));
  const left = assessment.scenarioIds.filter((id) => !done.has(id)).length;
  if (left) throw new HttpError(409, `Run every scenario first (${left} left).`);

  const updated = await db.assessmentAttempt.update({
    where: { id: attemptId },
    data: { completedAt: new Date(), quizScorePct: quizScore(assessment.questions, answers) },
  });
  await audit(user, "assessment.complete", { type: "Assessment", id: attempt.assessmentId }, { phase: attempt.phase });
  return { id: updated.id, completed: true };
}
