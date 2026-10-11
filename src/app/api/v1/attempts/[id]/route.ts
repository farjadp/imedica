import { route } from "@/server/api";
import { getAttempt } from "@/server/assessments/taking";
import { requireUser } from "@/server/auth/guards";

/** GET /api/v1/attempts/:id — the quiz (no answers until the post-test is done) and each scenario's run. */
export const GET = route<{ id: string }>(async (_req, { id }) => getAttempt(await requireUser(), id));
