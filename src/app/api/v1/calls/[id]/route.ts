import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { getCall } from "@/server/calls/service";

/** GET /api/v1/calls/:id — one call's transcript. */
export const GET = route<{ id: string }>(async (_req, { id }) => getCall(await requireUser(), id));
