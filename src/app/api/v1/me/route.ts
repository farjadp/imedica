import { route, readJson } from "@/server/api";
import { deleteOwnAccount } from "@/server/account/delete";
import { requireUser } from "@/server/auth/guards";

/** GET /api/v1/me — the signed-in user. */
export const GET = route(async () => requireUser());

/** DELETE /api/v1/me — a paramedic deletes their own account. Body: { password }. */
export const DELETE = route(async (req) => deleteOwnAccount(await requireUser(), await readJson(req)));
