import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { getRuntime } from "@/server/sessions/service";

/** GET /api/v1/sessions/:id — the live state of a run, without answers. */
export const GET = route<{ id: string }>(async (_req, { id }) => getRuntime(await requireUser(), id));
