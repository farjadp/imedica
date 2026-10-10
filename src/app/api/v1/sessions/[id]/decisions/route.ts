import { route, readJson } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { decide } from "@/server/sessions/service";

/** POST /api/v1/sessions/:id/decisions — { actionId } → the verdict. */
export const POST = route<{ id: string }>(async (req, { id }) => decide(await requireUser(), id, await readJson(req)));
