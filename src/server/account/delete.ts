import "server-only";
import { z } from "zod";

import { audit } from "../audit";
import { HttpError } from "../auth/guards";
import { verifyPassword } from "../auth/password";
import type { CurrentUser } from "../auth/session";
import { db } from "../db";

const schema = z.object({ password: z.string().min(1, "Enter your password.") });

/**
 * A paramedic deletes their own account (App Store 5.1.1(v)). The identity row
 * goes, and its sessions, reset tokens and push devices cascade with it.
 * Training runs are keyed by an anonymous hash of the user id, so once the
 * user is gone nothing links them back to a person.
 *
 * Staff accounts author and review clinical content, so they go through
 * support instead.
 */
export async function deleteOwnAccount(user: CurrentUser, body: unknown) {
  if (user.role !== "PARAMEDIC") {
    throw new HttpError(403, "Staff accounts are closed by Imedica support. Email hi@imedica.tech.");
  }
  const { password } = schema.parse(body);
  const row = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!row || !(await verifyPassword(password, row.passwordHash))) {
    throw new HttpError(403, "That password isn't right.");
  }

  // Logged first: the audit row keeps the opaque id and service, not the name or email.
  await audit(user, "account.delete", { type: "User", id: user.id });
  await db.user.delete({ where: { id: user.id } });
  return { deleted: true };
}
