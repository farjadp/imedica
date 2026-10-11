import { route, readJson } from "@/server/api";
import { requireUser } from "@/server/auth/guards";
import { registerDevice, unregisterDevice } from "@/server/push";

/** POST /api/v1/me/devices — register this phone for push. Body: { token, platform }. */
export const POST = route(async (req) => registerDevice(await requireUser(), await readJson(req)));

/** DELETE /api/v1/me/devices — stop push to this phone. Body: { token }. */
export const DELETE = route(async (req) => unregisterDevice(await requireUser(), await readJson(req)));
