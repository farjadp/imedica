import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { getAiStatus } from "@/server/sessions/service";

/** GET /api/v1/sessions/:id/explanation — poll until the AI explanation is ready. */
export const GET = route<{ id: string }>(async (_req, { id }) => getAiStatus(await requireUser(), id));
