import { route, readJson } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { createScenario, listScenarios } from "@/server/scenarios/service";

const STATUSES = ["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"] as const;

/** GET /api/v1/scenarios — published for learners; every status for authors. */
export const GET = route(async (req) => {
  const user = await requireUser();
  const status = new URL(req.url).searchParams.get("status");
  return listScenarios(user, {
    status: STATUSES.find((s) => s === status),
  });
});

/** POST /api/v1/scenarios — create a draft. */
export const POST = route(async (req) => createScenario(await requireUser(), await readJson(req)));
