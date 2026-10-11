"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type FormState, fieldErrors } from "@/lib/form";

import { audit } from "../audit";
import { HttpError, requireUser } from "../auth/guards";
import { hashPassword, passwordSchema, verifyPassword } from "../auth/password";
import { createSession, revokeAllSessions } from "../auth/session";
import { db } from "../db";

import { profileSchema, removeOwnAvatar, setOwnAvatar } from "./profile";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = profileSchema.safeParse({
    ...raw,
    certifications: (raw.certifications ?? "").split(",").map((c) => c.trim()).filter(Boolean),
    notifyAssessments: raw.notifyAssessments === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  await audit(user, "user.update", { type: "User", id: user.id }, { self: true });
  revalidatePath("/app", "layout");
  return { ok: true, message: "Saved." };
}

/** Profile photo from the web account page. */
export async function uploadAvatar(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  try {
    await setOwnAvatar(user, formData.get("file") as File | null);
  } catch (error) {
    if (error instanceof HttpError) return { message: error.message };
    throw error;
  }
  revalidatePath("/app", "layout");
  return { ok: true, message: "Photo updated." };
}

export async function deleteAvatar(): Promise<FormState> {
  await removeOwnAvatar(await requireUser());
  revalidatePath("/app", "layout");
  return { ok: true, message: "Photo removed." };
}

const passwordChangeSchema = z
  .object({ current: z.string().min(1, "Enter your current password."), password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "The passwords don't match." });

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(parsed.data.current, row.passwordHash))) {
    return { fieldErrors: { current: "That isn't your current password." } };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  // Sign out every other device, keep this one signed in.
  await revokeAllSessions(user.id);
  await createSession(user.id);
  await audit(user, "auth.password_reset", { type: "User", id: user.id }, { self: true });
  return { ok: true, message: "Password changed. Other devices were signed out." };
}
