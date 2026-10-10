import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { endSession } from "@/server/sessions/service";

/** POST /api/v1/sessions/:id/end — hand over care and finish the run. */
export const POST = route<{ id: string }>(async (_req, { id }) => endSession(await requireUser(), id));
