import { z } from "zod";

import { route, readJson } from "@/server/api";
import { startAssessmentRun } from "@/server/assessments/taking";
import { requireUser } from "@/server/auth/guards";

/** POST /api/v1/attempts/:id/runs — { scenarioId } starts that scenario in assessment mode. */
export const POST = route<{ id: string }>(async (req, { id }) => {
  const user = await requireUser();
  const { scenarioId } = z.object({ scenarioId: z.string().min(1) }).parse(await readJson(req));
  return startAssessmentRun(user, id, scenarioId);
});
