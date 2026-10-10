import { z } from "zod";

import { route, readJson } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { listMySessions, startSession } from "@/server/sessions/service";

/** GET /api/v1/sessions — your recent runs. */
export const GET = route(async () => listMySessions(await requireUser()));

/** POST /api/v1/sessions — { scenarioId } starts a run. */
export const POST = route(async (req) => {
  const user = await requireUser();
  const { scenarioId } = z.object({ scenarioId: z.string().min(1) }).parse(await readJson(req));
  return startSession(user, scenarioId);
});
