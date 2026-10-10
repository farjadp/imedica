import "server-only";
import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/enums";

import { type CurrentUser, getCurrentUser } from "./session";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Pages: send anonymous visitors to the sign-in page. */
export async function requireUserPage(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

/** Pages: signed in and holding one of the roles, else a 404-style bounce home. */
export async function requireRolePage(roles: Role[], next?: string): Promise<CurrentUser> {
  const user = await requireUserPage(next);
  if (!roles.includes(user.role)) redirect("/app");
  return user;
}

/** Route handlers and actions: throw instead of redirecting. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Sign in to continue.");
  return user;
}

export async function requireRole(roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new HttpError(403, "You don't have access to this.");
  return user;
}

export const CONTENT_ROLES: Role[] = ["PHYSICIAN", "ADMIN"];
export const STAFF_ROLES: Role[] = ["INSTRUCTOR", "PHYSICIAN", "ADMIN"];
export const ORG_MANAGER_ROLES: Role[] = ["INSTRUCTOR", "ADMIN"];

/**
 * Which organization's people and analytics a user may see.
 * Admins may pass any org (or none, for all); everyone else is pinned to theirs.
 */
export function scopeOrganization(user: CurrentUser, requested?: string | null): string | null {
  if (user.role === "ADMIN") return requested ?? null;
  if (!user.organizationId) throw new HttpError(403, "Your account isn't attached to an organization.");
  if (requested && requested !== user.organizationId) {
    throw new HttpError(403, "You can only see your own organization.");
  }
  return user.organizationId;
}
