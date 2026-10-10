import { route } from "@/server/api";
import { requireUser } from "@/server/auth/guards";

/** GET /api/v1/me — the signed-in user. */
export const GET = route(async () => requireUser());
