import { route } from "@/server/api";
import { finishAttempt } from "@/server/assessments/taking";
import { requireUser } from "@/server/auth/guards";

/** POST /api/v1/attempts/:id/finish — once every question is answered and every scenario run. */
export const POST = route<{ id: string }>(async (_req, { id }) => finishAttempt(await requireUser(), id));
