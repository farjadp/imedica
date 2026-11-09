import { route, readJson } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { attachArModel, listArModels } from "@/server/scenarios/ar-model";

type P = { id: string };

/** GET /api/v1/scenarios/:id/ar-models — every 3D model version, newest first (authors only). */
export const GET = route<P>(async (_req, { id }) => listArModels(await requireUser(), id));

/** POST /api/v1/scenarios/:id/ar-models — attach a new, unreviewed version. */
export const POST = route<P>(async (req, { id }) => attachArModel(await requireUser(), id, await readJson(req)));
