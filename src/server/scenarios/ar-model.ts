import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { type Hotspot, arModelReviewSchema, arModelSchema, hotspotSchema, resolveModelUrl } from "@/lib/validators/ar-model";

import { audit } from "../audit";
import { CONTENT_ROLES, HttpError } from "../auth/guards";
import type { CurrentUser } from "../auth/session";
import { db } from "../db";
import { env } from "../env";

// ============================================================================
// A scenario's 3D casualty ("look before you act", docs/product/ar-spike.md).
//
// Each attach adds a version; nothing is edited in place, so what a reviewer
// signed off is exactly what learners get. Learners only ever see the newest
// physician-reviewed version, and an author can't review their own upload
// (the same two-person rule as publishing a scenario; admins excepted).
// ============================================================================

function assertAuthor(user: CurrentUser) {
  if (!CONTENT_ROLES.includes(user.role)) throw new HttpError(403, "Only physicians can manage 3D models.");
}

async function loadScenario(scenarioId: string) {
  const scenario = await db.scenario.findUnique({ where: { id: scenarioId }, select: { id: true, status: true } });
  if (!scenario) throw new HttpError(404, "Scenario not found.");
  return scenario;
}

/** Hotspots are stored as JSON; read them back defensively so a bad row can't break the brief. */
function readHotspots(value: Prisma.JsonValue): Hotspot[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((h) => {
    const parsed = hotspotSchema.safeParse(h);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function listArModels(user: CurrentUser, scenarioId: string) {
  assertAuthor(user);
  await loadScenario(scenarioId);
  return db.scenarioArModel.findMany({ where: { scenarioId }, orderBy: { version: "desc" } });
}

export async function attachArModel(user: CurrentUser, scenarioId: string, body: unknown) {
  assertAuthor(user);
  const scenario = await loadScenario(scenarioId);
  if (scenario.status === "ARCHIVED") throw new HttpError(409, "Restore this scenario before changing its model.");
  const input = arModelSchema.parse(body);

  const actionIds = [...new Set(input.hotspots.flatMap((h) => (h.action ? [h.action] : [])))];
  if (actionIds.length) {
    const found = await db.scenarioAction.count({ where: { scenarioId, id: { in: actionIds } } });
    if (found !== actionIds.length) throw new HttpError(422, "A hotspot points at an action that isn't part of this scenario.");
  }

  const last = await db.scenarioArModel.findFirst({ where: { scenarioId }, orderBy: { version: "desc" }, select: { version: true } });
  const model = await db.scenarioArModel.create({
    data: { ...input, scenarioId, version: (last?.version ?? 0) + 1, createdById: user.id },
  });
  await audit(user, "scenario.ar_model_attach", { type: "Scenario", id: scenarioId }, { modelId: model.id, version: model.version });
  return model;
}

export async function reviewArModel(user: CurrentUser, scenarioId: string, modelId: string, body: unknown) {
  assertAuthor(user);
  const { action } = arModelReviewSchema.parse(body);
  const model = await db.scenarioArModel.findFirst({ where: { id: modelId, scenarioId } });
  if (!model) throw new HttpError(404, "Model not found in this scenario.");

  if (action === "approve" && model.createdById === user.id && user.role !== "ADMIN") {
    throw new HttpError(403, "A second physician has to review the model you attached.");
  }

  const updated = await db.scenarioArModel.update({
    where: { id: modelId },
    data: action === "approve" ? { reviewerId: user.id, reviewedAt: new Date() } : { reviewerId: null, reviewedAt: null },
  });
  await audit(user, "scenario.ar_model_review", { type: "Scenario", id: scenarioId }, { modelId, version: model.version, action });
  return updated;
}

/** What learners (web and app) get: the newest reviewed version, or null. */
export type ServedArModel = {
  id: string;
  version: number;
  glbUrl: string;
  usdzUrl: string;
  posterUrl: string | null;
  heightMeters: number;
  attribution: { licence: string; source: string };
  hotspots: Hotspot[];
};

export async function servedArModel(scenarioId: string): Promise<ServedArModel | null> {
  const model = await db.scenarioArModel.findFirst({
    where: { scenarioId, reviewedAt: { not: null }, reviewerId: { not: null } },
    orderBy: { version: "desc" },
  });
  if (!model) return null;
  const base = env().APP_URL;
  return {
    id: model.id,
    version: model.version,
    glbUrl: resolveModelUrl(model.glbUrl, base),
    usdzUrl: resolveModelUrl(model.usdzUrl, base),
    posterUrl: model.posterUrl ? resolveModelUrl(model.posterUrl, base) : null,
    heightMeters: model.heightMeters,
    attribution: { licence: model.licence, source: model.source },
    hotspots: readHotspots(model.hotspots),
  };
}
