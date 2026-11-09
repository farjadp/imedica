import { route, readJson } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { reviewArModel } from "@/server/scenarios/ar-model";

/** POST /api/v1/scenarios/:id/ar-models/:modelId/review — { action: approve | revoke } */
export const POST = route<{ id: string; modelId: string }>(async (req, { id, modelId }) =>
  reviewArModel(await requireUser(), id, modelId, await readJson(req)),
);
