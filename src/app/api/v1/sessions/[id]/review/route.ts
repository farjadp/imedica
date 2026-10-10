import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { getReview } from "@/server/sessions/service";

/** GET /api/v1/sessions/:id/review — the full debrief of a finished run. */
export const GET = route<{ id: string }>(async (_req, { id }) => getReview(await requireUser(), id));
