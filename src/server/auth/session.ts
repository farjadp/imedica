import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";

import type { ParamedicLevel, Role } from "@/generated/prisma/enums";

import { db } from "../db";
import { hashToken, newToken } from "./tokens";

export const SESSION_COOKIE = "imedica_session";
const SESSION_DAYS = 14;

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  level: ParamedicLevel | null;
  yearsExperience: number | null;
  organizationId: string | null;
  organizationName: string | null;
};

export async function createSession(userId: string, opts: { setCookie?: boolean } = {}) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 255) ?? null;

  await db.authSession.create({
    data: { tokenHash: hashToken(token), userId, expiresAt, userAgent },
  });
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });

  if (opts.setCookie === false) return token;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const bearer = (await headers()).get("authorization");
  const token = bearer?.startsWith("Bearer ") ? bearer.slice(7) : jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.authSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

/** Ends every session a user has, e.g. after a password reset or deactivation. */
export async function revokeAllSessions(userId: string) {
  await db.authSession.deleteMany({ where: { userId } });
}

/**
 * Resolves the signed-in user from the session cookie, or from an
 * `Authorization: Bearer` header (the mobile app). Cached for one request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const bearer = (await headers()).get("authorization");
  const token = bearer?.startsWith("Bearer ")
    ? bearer.slice(7)
    : (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { organization: { select: { name: true, active: true } } } } },
  });
  if (!session || session.expiresAt < new Date()) return null;

  const u = session.user;
  if (!u.active) return null;
  // A deactivated organization locks its members out; Imedica admins have none.
  if (u.organizationId && session.user.organization && !session.user.organization.active) return null;

  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    level: u.level,
    yearsExperience: u.yearsExperience,
    organizationId: u.organizationId,
    organizationName: u.organization?.name ?? null,
  };
});
