import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { ScenarioStatus } from "@/generated/prisma/enums";
import {
  actionPatchSchema,
  actionSchema,
  feedbackPatchSchema,
  feedbackSchema,
  reorderSchema,
  rulePatchSchema,
  ruleSchema,
  scenarioPatchSchema,
  scenarioSchema,
  statePatchSchema,
  stateSchema,
  statusChangeSchema,
} from "@/lib/validators/scenario";

import { audit } from "../audit";
import { CONTENT_ROLES, HttpError } from "../auth/guards";
import type { CurrentUser } from "../auth/session";
import { db } from "../db";
import { publishProblems } from "./publish-check";

// ============================================================================
// Scenario authoring. Every write goes through here, from the API or the UI.
// Physicians and admins author; everyone signed in can read published work.
// ============================================================================

function assertAuthor(user: CurrentUser) {
  if (!CONTENT_ROLES.includes(user.role)) throw new HttpError(403, "Only physicians can edit scenarios.");
}

/**
 * Only drafts are editable. Published work is locked so learners never see a
 * half-edit; work in review is locked so the reviewer publishes exactly what
 * they checked, and can't slip in changes nobody else has seen.
 */
async function loadEditable(user: CurrentUser, scenarioId: string) {
  assertAuthor(user);
  const scenario = await db.scenario.findUnique({ where: { id: scenarioId } });
  if (!scenario) throw new HttpError(404, "Scenario not found.");
  if (scenario.status === "PUBLISHED") {
    throw new HttpError(409, "This scenario is published. Unpublish it before editing.");
  }
  if (scenario.status === "IN_REVIEW") {
    throw new HttpError(409, "This scenario is in review. Send it back to draft before editing.");
  }
  if (scenario.status === "ARCHIVED") throw new HttpError(409, "Restore this scenario before editing.");
  return scenario;
}

async function touch(scenarioId: string) {
  await db.scenario.update({ where: { id: scenarioId }, data: { updatedAt: new Date() } });
}

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "scenario"
  );
}

async function uniqueSlug(title: string) {
  const base = slugify(title);
  for (let n = 0; n < 50; n++) {
    const slug = n === 0 ? base : `${base}-${n + 1}`;
    if (!(await db.scenario.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// ─── Read ───────────────────────────────────────────────────────────────────

export async function listScenarios(user: CurrentUser, filter: { status?: ScenarioStatus } = {}) {
  const authoring = CONTENT_ROLES.includes(user.role);
  const where: Prisma.ScenarioWhereInput = authoring
    ? filter.status
      ? { status: filter.status }
      : { status: { not: "ARCHIVED" } }
    : { status: "PUBLISHED" };

  return db.scenario.findMany({
    where,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      category: true,
      difficulty: true,
      status: true,
      timeLimitSec: true,
      authorId: true,
      updatedAt: true,
      publishedAt: true,
      _count: { select: { states: true, rules: true, sessions: true } },
    },
  });
}

/**
 * What a learner sees before a run: the brief and nothing else. States carry
 * the narrative, vitals and debrief, so handing them over would give away how
 * the call unfolds and ends — fatal for training and pre/post assessments.
 */
const briefSelect = {
  id: true,
  title: true,
  summary: true,
  dispatch: true,
  category: true,
  difficulty: true,
  timeLimitSec: true,
  learningGoals: true,
  protocolSource: true,
  publishedAt: true,
} satisfies Prisma.ScenarioSelect;

export async function getScenarioBrief(scenarioId: string) {
  const scenario = await db.scenario.findFirst({ where: { id: scenarioId, status: "PUBLISHED" }, select: briefSelect });
  if (!scenario) throw new HttpError(404, "Scenario not found.");
  return scenario;
}

/** Everything, for authors: states, actions, rules, feedback and publish problems. */
export async function getScenarioForAuthor(user: CurrentUser, scenarioId: string) {
  assertAuthor(user);
  const scenario = await db.scenario.findUnique({
    where: { id: scenarioId },
    include: {
      states: { orderBy: { order: "asc" } },
      actions: { orderBy: [{ category: "asc" }, { order: "asc" }] },
      rules: { orderBy: [{ priority: "asc" }] },
      feedback: { orderBy: { title: "asc" } },
    },
  });
  if (!scenario) throw new HttpError(404, "Scenario not found.");
  return { ...scenario, problems: publishProblems(scenario) };
}

/** GET /api/v1/scenarios/:id — the whole scenario for authors, the brief for learners. */
export async function getScenarioFull(user: CurrentUser, scenarioId: string) {
  return CONTENT_ROLES.includes(user.role) ? getScenarioForAuthor(user, scenarioId) : getScenarioBrief(scenarioId);
}

// ─── Scenario ───────────────────────────────────────────────────────────────

export async function createScenario(user: CurrentUser, body: unknown) {
  assertAuthor(user);
  const input = scenarioSchema.parse(body);
  const scenario = await db.scenario.create({
    data: { ...input, slug: await uniqueSlug(input.title), authorId: user.id },
  });
  await audit(user, "scenario.create", { type: "Scenario", id: scenario.id }, { title: scenario.title });
  return scenario;
}

export async function updateScenario(user: CurrentUser, scenarioId: string, body: unknown) {
  await loadEditable(user, scenarioId);
  const input = scenarioPatchSchema.parse(body);
  const scenario = await db.scenario.update({ where: { id: scenarioId }, data: input });
  await audit(user, "scenario.update", { type: "Scenario", id: scenarioId }, { fields: Object.keys(input) });
  return scenario;
}

export async function deleteScenario(user: CurrentUser, scenarioId: string) {
  const scenario = await loadEditable(user, scenarioId);
  const runs = await db.trainingSession.count({ where: { scenarioId } });
  if (runs > 0) throw new HttpError(409, "This scenario has training runs. Archive it instead of deleting.");
  await db.scenario.delete({ where: { id: scenarioId } });
  await audit(user, "scenario.delete", { type: "Scenario", id: scenarioId }, { title: scenario.title });
  return { deleted: true };
}

export async function changeStatus(user: CurrentUser, scenarioId: string, body: unknown) {
  assertAuthor(user);
  const { action } = statusChangeSchema.parse(body);
  const scenario = await db.scenario.findUnique({
    where: { id: scenarioId },
    include: { states: true, actions: true, rules: true },
  });
  if (!scenario) throw new HttpError(404, "Scenario not found.");

  const transitions: Record<typeof action, { from: ScenarioStatus[]; to: ScenarioStatus }> = {
    submit: { from: ["DRAFT"], to: "IN_REVIEW" },
    publish: { from: ["IN_REVIEW"], to: "PUBLISHED" },
    unpublish: { from: ["PUBLISHED", "IN_REVIEW"], to: "DRAFT" },
    archive: { from: ["DRAFT", "IN_REVIEW", "PUBLISHED"], to: "ARCHIVED" },
    restore: { from: ["ARCHIVED"], to: "DRAFT" },
  };
  const t = transitions[action];
  if (!t.from.includes(scenario.status)) {
    throw new HttpError(409, `A ${scenario.status.toLowerCase().replace("_", " ")} scenario can't be sent to ${action}.`);
  }

  if (action === "submit" || action === "publish") {
    const problems = publishProblems(scenario);
    if (problems.length) throw new HttpError(422, `Not ready yet: ${problems.join(" ")}`);
  }
  // Two-person rule: the author can't approve their own work (admins excepted).
  if (action === "publish" && scenario.authorId === user.id && user.role !== "ADMIN") {
    throw new HttpError(403, "A second physician has to review and publish your scenario.");
  }

  const updated = await db.scenario.update({
    where: { id: scenarioId },
    data: {
      status: t.to,
      ...(action === "publish" ? { publishedAt: new Date(), reviewerId: user.id } : {}),
    },
  });
  const auditAction = {
    submit: "scenario.submit",
    publish: "scenario.publish",
    unpublish: "scenario.update",
    archive: "scenario.archive",
    restore: "scenario.update",
  } as const;
  await audit(user, auditAction[action], { type: "Scenario", id: scenarioId }, { from: scenario.status, to: t.to });
  return updated;
}

// ─── Child collections: states, actions, rules, feedback ───────────────────

export type Collection = "states" | "actions" | "rules" | "feedback";
export const COLLECTIONS: Collection[] = ["states", "actions", "rules", "feedback"];

export function asCollection(value: string): Collection {
  const c = COLLECTIONS.find((x) => x === value);
  if (!c) throw new HttpError(404, "Unknown collection. Use states, actions, rules or feedback.");
  return c;
}

async function assertBelongs(scenarioId: string, ids: (string | null | undefined)[], model: "state" | "action" | "feedback") {
  const wanted = [...new Set(ids.filter((v): v is string => Boolean(v)))];
  if (!wanted.length) return;
  const where = { id: { in: wanted }, scenarioId };
  const found =
    model === "state"
      ? await db.scenarioState.count({ where })
      : model === "action"
        ? await db.scenarioAction.count({ where })
        : await db.feedbackTemplate.count({ where });
  if (found !== wanted.length) throw new HttpError(422, `That ${model} isn't part of this scenario.`);
}

/** Only one start state per scenario: setting a new one clears the old. */
async function clearOtherStarts(scenarioId: string, keepId?: string) {
  await db.scenarioState.updateMany({
    where: { scenarioId, isStart: true, ...(keepId ? { id: { not: keepId } } : {}) },
    data: { isStart: false },
  });
}

export async function createChild(user: CurrentUser, scenarioId: string, collection: Collection, body: unknown) {
  await loadEditable(user, scenarioId);
  let created: { id: string };

  switch (collection) {
    case "states": {
      const input = stateSchema.parse(body);
      const order = await db.scenarioState.count({ where: { scenarioId } });
      created = await db.scenarioState.create({ data: { ...input, scenarioId, order } });
      if (input.isStart) await clearOtherStarts(scenarioId, created.id);
      break;
    }
    case "actions": {
      const input = actionSchema.parse(body);
      const order = await db.scenarioAction.count({ where: { scenarioId } });
      created = await db.scenarioAction.create({ data: { ...input, scenarioId, order } });
      break;
    }
    case "rules": {
      const input = ruleSchema.parse(body);
      await assertBelongs(scenarioId, [input.fromStateId, input.toStateId], "state");
      await assertBelongs(scenarioId, [input.actionId], "action");
      await assertBelongs(scenarioId, [input.feedbackId], "feedback");
      created = await db.scenarioRule.create({ data: { ...input, scenarioId } });
      break;
    }
    case "feedback": {
      const input = feedbackSchema.parse(body);
      created = await db.feedbackTemplate.create({ data: { ...input, scenarioId } });
      break;
    }
  }
  await touch(scenarioId);
  await audit(user, "scenario.update", { type: "Scenario", id: scenarioId }, { added: collection, id: created.id });
  return created;
}

export async function updateChild(
  user: CurrentUser,
  scenarioId: string,
  collection: Collection,
  itemId: string,
  body: unknown,
) {
  await loadEditable(user, scenarioId);
  const where = { id: itemId, scenarioId };
  let updated: { id: string } | null = null;

  switch (collection) {
    case "states": {
      const input = statePatchSchema.parse(body);
      if (await db.scenarioState.count({ where })) {
        updated = await db.scenarioState.update({ where: { id: itemId }, data: input });
        if (input.isStart) await clearOtherStarts(scenarioId, itemId);
      }
      break;
    }
    case "actions": {
      const input = actionPatchSchema.parse(body);
      if (await db.scenarioAction.count({ where })) {
        updated = await db.scenarioAction.update({ where: { id: itemId }, data: input });
      }
      break;
    }
    case "rules": {
      const input = rulePatchSchema.parse(body);
      await assertBelongs(scenarioId, [input.fromStateId, input.toStateId], "state");
      await assertBelongs(scenarioId, [input.actionId], "action");
      await assertBelongs(scenarioId, [input.feedbackId], "feedback");
      if (await db.scenarioRule.count({ where })) {
        updated = await db.scenarioRule.update({ where: { id: itemId }, data: input });
      }
      break;
    }
    case "feedback": {
      const input = feedbackPatchSchema.parse(body);
      if (await db.feedbackTemplate.count({ where })) {
        updated = await db.feedbackTemplate.update({ where: { id: itemId }, data: input });
      }
      break;
    }
  }
  if (!updated) throw new HttpError(404, "Not found in this scenario.");
  await touch(scenarioId);
  await audit(user, "scenario.update", { type: "Scenario", id: scenarioId }, { changed: collection, id: itemId });
  return updated;
}

export async function deleteChild(user: CurrentUser, scenarioId: string, collection: Collection, itemId: string) {
  await loadEditable(user, scenarioId);
  const where = { id: itemId, scenarioId };
  const result =
    collection === "states"
      ? await db.scenarioState.deleteMany({ where })
      : collection === "actions"
        ? await db.scenarioAction.deleteMany({ where })
        : collection === "rules"
          ? await db.scenarioRule.deleteMany({ where })
          : await db.feedbackTemplate.deleteMany({ where });
  if (result.count === 0) throw new HttpError(404, "Not found in this scenario.");
  await touch(scenarioId);
  await audit(user, "scenario.update", { type: "Scenario", id: scenarioId }, { removed: collection, id: itemId });
  return { deleted: true };
}

export async function reorderChildren(user: CurrentUser, scenarioId: string, collection: Collection, body: unknown) {
  await loadEditable(user, scenarioId);
  if (collection !== "states" && collection !== "actions") {
    throw new HttpError(400, "Only states and actions can be reordered. Rules use priority.");
  }
  const { ids } = reorderSchema.parse(body);
  const model = collection === "states" ? db.scenarioState : db.scenarioAction;
  const count = await (model as typeof db.scenarioState).count({ where: { scenarioId, id: { in: ids } } });
  if (count !== ids.length) throw new HttpError(422, "The list includes items from another scenario.");

  await db.$transaction(
    ids.map((id, order) =>
      collection === "states"
        ? db.scenarioState.update({ where: { id }, data: { order } })
        : db.scenarioAction.update({ where: { id }, data: { order } }),
    ),
  );
  await touch(scenarioId);
  return { reordered: ids.length };
}
