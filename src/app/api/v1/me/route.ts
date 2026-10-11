import { route, readJson } from "@/server/api";
import { deleteOwnAccount } from "@/server/account/delete";
import { updateOwnProfile } from "@/server/account/profile";
import { requireUser } from "@/server/auth/guards";

/** GET /api/v1/me — the signed-in user. */
export const GET = route(async () => requireUser());

/** PATCH /api/v1/me — update your own profile. Only the fields sent change. */
export const PATCH = route(async (req) => updateOwnProfile(await requireUser(), await readJson(req)));

/** DELETE /api/v1/me — a paramedic deletes their own account. Body: { password }. */
export const DELETE = route(async (req) => deleteOwnAccount(await requireUser(), await readJson(req)));
