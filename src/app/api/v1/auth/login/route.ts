import { z } from "zod";

import { route, readJson } from "@/server/api";
import { audit } from "@/server/audit";
import { HttpError } from "@/server/auth/guards";
import { dummyHash, verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { clientIp, limited } from "@/server/rate-limit";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

/**
 * POST /api/v1/auth/login — for the mobile app. Returns a bearer token to send
 * as `Authorization: Bearer <token>`. The web app uses the cookie instead.
 */
export const POST = route(async (req) => {
  const { email, password } = schema.parse(await readJson(req));
  if (limited(`login:${await clientIp()}`, 20, 15 * 60_000) || limited(`login:${email}`, 8, 15 * 60_000)) {
    throw new HttpError(429, "Too many attempts. Wait fifteen minutes and try again.");
  }

  const user = await db.user.findUnique({ where: { email }, include: { organization: { select: { active: true } } } });
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !ok) throw new HttpError(401, "That email and password don't match an account.");
  if (!user.active || (user.organization && !user.organization.active)) {
    throw new HttpError(403, "This account is turned off.");
  }

  const token = await createSession(user.id, { setCookie: false });
  await audit({ id: user.id, role: user.role, organizationId: user.organizationId }, "auth.login", undefined, { client: "api" });
  return { token, expiresInDays: 14 };
});
