import "server-only";
import { z } from "zod";

import { audit } from "../audit";
import { HttpError } from "../auth/guards";
import { hashPassword, passwordSchema, verifyPassword } from "../auth/password";
import type { CurrentUser } from "../auth/session";
import { createSession, revokeAllSessions } from "../auth/session";
import { db } from "../db";
import { sniffImage } from "../blog/image";

// The profile a person keeps about themselves, shared by the web account page
// and PATCH /api/v1/me. Level and experience reach analytics only as ranges;
// nothing else here leaves the identity schema.

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .transform((v) => v || null)
    .nullable();

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(80),
  lastName: z.string().trim().min(1, "Enter your last name.").max(80),
  preferredName: optionalText(60),
  pronouns: optionalText(30),
  level: z
    .enum(["PCP", "ACP", "CCP", "EMR", "STUDENT", "OTHER", ""])
    .transform((v) => v || null)
    .nullable(),
  yearsExperience: z.union([z.literal("").transform(() => null), z.coerce.number().int().min(0).max(60)]).nullable(),
  station: optionalText(80),
  bio: optionalText(280),
  certifications: z
    .array(z.string().trim().min(1).max(40))
    .max(12, "Twelve is the most you can list.")
    .transform((list) => [...new Set(list)]),
  notifyAssessments: z.boolean(),
});
export type ProfileInput = z.input<typeof profileSchema>;

/** Partial update: only the fields sent are changed. */
export async function updateOwnProfile(user: CurrentUser, body: unknown) {
  const d = profileSchema.partial().parse(body);
  await db.user.update({ where: { id: user.id }, data: d });
  await audit(user, "user.update", { type: "User", id: user.id }, { self: true, fields: Object.keys(d) });
  return { saved: true };
}

const passwordChangeSchema = z
  .object({ current: z.string().min(1, "Enter your current password."), password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "The passwords don't match." });

/**
 * Changes the password and signs out every other session. Returns a fresh
 * token for this device when `keepToken` is set (the app), else sets the
 * cookie (the web).
 */
export async function changeOwnPassword(user: CurrentUser, body: unknown, opts: { bearer: boolean }) {
  const d = passwordChangeSchema.parse(body);
  const row = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
  if (!(await verifyPassword(d.current, row.passwordHash))) {
    throw new HttpError(403, "That isn't your current password.");
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(d.password) } });
  await revokeAllSessions(user.id);
  const token = await createSession(user.id, { setCookie: !opts.bearer });
  await audit(user, "auth.password_reset", { type: "User", id: user.id }, { self: true });
  return opts.bearer ? { token } : { changed: true };
}

// ─── avatar ──────────────────────────────────────────────────────────────────

// The app crops to a square and resizes to 512 px before uploading, which
// lands well under this. The web sends what the person picked.
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export async function setOwnAvatar(user: CurrentUser, file: File | null) {
  if (!file || typeof file === "string") throw new HttpError(400, "Choose a photo to upload.");
  if (file.size > MAX_AVATAR_BYTES) throw new HttpError(413, "That photo is over 2 MB. Pick a smaller one.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImage(bytes);
  if (!mime) throw new HttpError(415, "Use a JPEG, PNG or WebP photo.");

  const now = new Date();
  await db.$transaction([
    db.userAvatar.upsert({
      where: { userId: user.id },
      create: { userId: user.id, mime, bytes, size: bytes.length },
      update: { mime, bytes, size: bytes.length },
    }),
    db.user.update({ where: { id: user.id }, data: { avatarUpdatedAt: now } }),
  ]);
  await audit(user, "user.update", { type: "User", id: user.id }, { self: true, fields: ["avatar"] });
  return { avatarVersion: String(now.getTime()) };
}

export async function removeOwnAvatar(user: CurrentUser) {
  await db.$transaction([
    db.userAvatar.deleteMany({ where: { userId: user.id } }),
    db.user.update({ where: { id: user.id }, data: { avatarUpdatedAt: null } }),
  ]);
  return { avatarVersion: null };
}

export async function readAvatar(userId: string) {
  return db.userAvatar.findUnique({ where: { userId }, select: { mime: true, bytes: true, updatedAt: true } });
}
