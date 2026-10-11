import { route, readJson } from "@/server/api";
import { changeOwnPassword } from "@/server/account/profile";
import { HttpError, requireUser } from "@/server/auth/guards";
import { limited } from "@/server/rate-limit";

/**
 * POST /api/v1/me/password — body { current, password, confirm }. Signs out
 * every other device. A bearer caller (the app) gets a new token back.
 */
export const POST = route(async (req) => {
  const user = await requireUser();
  if (await limited(`password-change:${user.id}`, 5, 15 * 60 * 1000)) {
    throw new HttpError(429, "Too many attempts. Wait 15 minutes and try again.");
  }
  const bearer = req.headers.get("authorization")?.startsWith("Bearer ") ?? false;
  return changeOwnPassword(user, await readJson(req), { bearer });
});
