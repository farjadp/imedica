import "server-only";

import type { ScenarioStatus } from "@/generated/prisma/enums";
import {
  assessmentPatchSchema,
  assessmentSchema,
  questionOrderSchema,
  questionPatchSchema,
  questionSchema,
} from "@/lib/validators/assessment";
import { statusChangeSchema } from "@/lib/validators/scenario";

import { audit } from "../audit";
import { CONTENT_ROLES, HttpError, ORG_MANAGER_ROLES } from "../auth/guards";
import type { CurrentUser } from "../auth/session";
import { db } from "../db";
import { assessmentProblems } from "./score";

// ============================================================================
// Assessment authoring. Physicians and admins write; training leads may read
// published assessments (to open windows), without the answers; paramedics
// only ever meet an assessment through an open window.
// ============================================================================

function assertAuthor(user: CurrentUser) {
  if (!CONTENT_ROLES.includes(user.role)) throw new HttpError(403, "Only physicians can edit assessments.");
}

/** Only drafts are editable, for the same reasons as scenarios. */
async function loadEditable(user: CurrentUser, assessmentId: string) {
  assertAuthor(user);
  const assessment = await db.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) throw new HttpError(404, "Assessment not found.");
  if (assessment.status !== "DRAFT") {
    throw new HttpError(409, "Only drafts can be edited. Send it back to draft first.");
  }
  return assessment;
}

async function assertPublishedScenarios(ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length !== ids.length) throw new HttpError(422, "Each scenario can only be in the assessment once.");
  const found = await db.scenario.count({ where: { id: { in: unique }, status: "PUBLISHED" } });
  if (found !== unique.length) throw new HttpError(422, "Only published scenarios can be part of an assessment.");
}

async function publishedScenarioIds(ids: string[]) {
  const rows = await db.scenario.findMany({ where: { id: { in: ids }, status: "PUBLISHED" }, select: { id: true } });
  return new Set(rows.map((r) => r.id));
}

async function touch(assessmentId: string) {
  await db.assessment.update({ where: { id: assessmentId }, data: { updatedAt: new Date() } });
}

// ─── Read ───────────────────────────────────────────────────────────────────

export async function listAssessments(user: CurrentUser) {
  const authoring = CONTENT_ROLES.includes(user.role);
  if (!authoring && !ORG_MANAGER_ROLES.includes(user.role)) throw new HttpError(403, "You don't have access to this.");
  const rows = await db.assessment.findMany({
    where: authoring ? { status: { not: "ARCHIVED" } } : { status: "PUBLISHED" },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { _count: { select: { questions: true, attempts: true } } },
  });
  return rows.map(({ _count, ...a }) => ({ ...a, questionCount: _count.questions, attemptCount: _count.attempts }));
}

export async function getAssessment(user: CurrentUser, assessmentId: string) {
  const a = await db.assessment.findUnique({
    where: { id: assessmentId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!a) throw new HttpError(404, "Assessment not found.");

  if (CONTENT_ROLES.includes(user.role)) {
    const problems = assessmentProblems({
      scenarioIds: a.scenarioIds,
      publishedScenarioIds: await publishedScenarioIds(a.scenarioIds),
      questions: a.questions,
    });
    return { ...a, problems };
  }
  // Training leads see what they'd be opening, never the answers.
  if (ORG_MANAGER_ROLES.includes(user.role) && a.status === "PUBLISHED") {
    const { questions, ...rest } = a;
    return { ...rest, questionCount: questions.length };
  }
  throw new HttpError(404, "Assessment not found.");
}

// ─── Assessment ─────────────────────────────────────────────────────────────

export async function createAssessment(user: CurrentUser, body: unknown) {
  assertAuthor(user);
  const input = assessmentSchema.parse(body);
  await assertPublishedScenarios(input.scenarioIds);
  const a = await db.assessment.create({ data: { ...input, authorId: user.id } });
  await audit(user, "assessment.create", { type: "Assessment", id: a.id }, { title: a.title });
  return a;
}

export async function updateAssessment(user: CurrentUser, assessmentId: string, body: unknown) {
  await loadEditable(user, assessmentId);
  const input = assessmentPatchSchema.parse(body);
  if (input.scenarioIds) await assertPublishedScenarios(input.scenarioIds);
  const a = await db.assessment.update({ where: { id: assessmentId }, data: input });
  await audit(user, "assessment.update", { type: "Assessment", id: assessmentId }, { fields: Object.keys(input) });
  return a;
}

export async function deleteAssessment(user: CurrentUser, assessmentId: string) {
  const a = await loadEditable(user, assessmentId);
  if (await db.assessmentAttempt.count({ where: { assessmentId } })) {
    throw new HttpError(409, "People have taken this assessment. Archive it instead of deleting.");
  }
  await db.assessment.delete({ where: { id: assessmentId } });
  await audit(user, "assessment.update", { type: "Assessment", id: assessmentId }, { deleted: a.title });
  return { deleted: true };
}

export async function changeAssessmentStatus(user: CurrentUser, assessmentId: string, body: unknown) {
  assertAuthor(user);
  const { action } = statusChangeSchema.parse(body);
  const a = await db.assessment.findUnique({ where: { id: assessmentId }, include: { questions: true } });
  if (!a) throw new HttpError(404, "Assessment not found.");

  const transitions: Record<typeof action, { from: ScenarioStatus[]; to: ScenarioStatus }> = {
    submit: { from: ["DRAFT"], to: "IN_REVIEW" },
    publish: { from: ["IN_REVIEW"], to: "PUBLISHED" },
    unpublish: { from: ["PUBLISHED", "IN_REVIEW"], to: "DRAFT" },
    archive: { from: ["DRAFT", "IN_REVIEW", "PUBLISHED"], to: "ARCHIVED" },
    restore: { from: ["ARCHIVED"], to: "DRAFT" },
  };
  const t = transitions[action];
  if (!t.from.includes(a.status)) {
    throw new HttpError(409, `A ${a.status.toLowerCase().replace("_", " ")} assessment can't be sent to ${action}.`);
  }

  if (action === "submit" || action === "publish") {
    const problems = assessmentProblems({
      scenarioIds: a.scenarioIds,
      publishedScenarioIds: await publishedScenarioIds(a.scenarioIds),
      questions: a.questions,
    });
    if (problems.length) throw new HttpError(422, `Not ready yet: ${problems.join(" ")}`);
  }
  // Two-person rule: the author can't approve their own work (admins excepted).
  if (action === "publish" && a.authorId === user.id && user.role !== "ADMIN") {
    throw new HttpError(403, "A second physician has to review and publish your assessment.");
  }

  const updated = await db.assessment.update({
    where: { id: assessmentId },
    data: { status: t.to, ...(action === "publish" ? { publishedAt: new Date(), reviewerId: user.id } : {}) },
  });
  const auditAction =
    action === "submit" ? "assessment.submit" : action === "publish" ? "assessment.publish" : "assessment.update";
  await audit(user, auditAction, { type: "Assessment", id: assessmentId }, { from: a.status, to: t.to });
  return updated;
}

// ─── Questions ──────────────────────────────────────────────────────────────

export async function createQuestion(user: CurrentUser, assessmentId: string, body: unknown) {
  await loadEditable(user, assessmentId);
  const input = questionSchema.parse(body);
  const order = await db.assessmentQuestion.count({ where: { assessmentId } });
  const q = await db.assessmentQuestion.create({ data: { ...input, assessmentId, order } });
  await touch(assessmentId);
  await audit(user, "assessment.update", { type: "Assessment", id: assessmentId }, { added: "question", id: q.id });
  return q;
}

export async function updateQuestion(user: CurrentUser, assessmentId: string, questionId: string, body: unknown) {
  await loadEditable(user, assessmentId);
  const current = await db.assessmentQuestion.findFirst({ where: { id: questionId, assessmentId } });
  if (!current) throw new HttpError(404, "Not found in this assessment.");
  const patch = questionPatchSchema.parse(body);
  // Validate the question as it will be stored, so options and answer stay consistent.
  const merged = questionSchema.parse({ ...current, ...patch });
  const q = await db.assessmentQuestion.update({
    where: { id: questionId },
    data: {
      stem: merged.stem,
      options: merged.options,
      correctIndex: merged.correctIndex,
      rationale: merged.rationale,
      reference: merged.reference,
    },
  });
  await touch(assessmentId);
  await audit(user, "assessment.update", { type: "Assessment", id: assessmentId }, { changed: "question", id: questionId });
  return q;
}

export async function deleteQuestion(user: CurrentUser, assessmentId: string, questionId: string) {
  await loadEditable(user, assessmentId);
  const { count } = await db.assessmentQuestion.deleteMany({ where: { id: questionId, assessmentId } });
  if (!count) throw new HttpError(404, "Not found in this assessment.");
  await touch(assessmentId);
  await audit(user, "assessment.update", { type: "Assessment", id: assessmentId }, { removed: "question", id: questionId });
  return { deleted: true };
}

export async function reorderQuestions(user: CurrentUser, assessmentId: string, body: unknown) {
  await loadEditable(user, assessmentId);
  const { ids } = questionOrderSchema.parse(body);
  const count = await db.assessmentQuestion.count({ where: { assessmentId, id: { in: ids } } });
  if (count !== new Set(ids).size || count !== ids.length) {
    throw new HttpError(422, "The list includes questions from another assessment.");
  }
  await db.$transaction(ids.map((id, order) => db.assessmentQuestion.update({ where: { id }, data: { order } })));
  await touch(assessmentId);
  return { reordered: ids.length };
}
