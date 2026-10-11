import { z } from "zod";

import { route, readJson } from "@/server/api";
import { myAssessments, startAttempt } from "@/server/assessments/taking";
import { requireUser } from "@/server/auth/guards";

/** GET /api/v1/attempts — assessments open for your service, and your progress. */
export const GET = route(async () => myAssessments(await requireUser()));

/** POST /api/v1/attempts — { windowId } starts or resumes your attempt. */
export const POST = route(async (req) => {
  const user = await requireUser();
  const { windowId } = z.object({ windowId: z.string().min(1) }).parse(await readJson(req));
  return startAttempt(user, windowId);
});
