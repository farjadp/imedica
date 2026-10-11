import { route, readJson } from "@/server/api";
import { HttpError } from "@/server/auth/guards";
import { acceptInvite, acceptSchema } from "@/server/auth/invitations";
import { createSession } from "@/server/auth/session";
import { clientIp, limited } from "@/server/rate-limit";

/**
 * POST /api/v1/invitations/:token/accept — join from the app. Body: first and
 * last name, optional level and years, password and confirm. Returns a bearer
 * token, like /auth/login.
 */
export const POST = route<{ token: string }>(async (req, { token }) => {
  if (await limited(`join:${await clientIp()}`, 10, 15 * 60_000)) {
    throw new HttpError(429, "Too many attempts. Wait fifteen minutes and try again.");
  }
  const input = acceptSchema.parse(await readJson(req));
  const user = await acceptInvite(token, input);
  const session = await createSession(user.id, { setCookie: false });
  return { token: session, expiresInDays: 14 };
});
