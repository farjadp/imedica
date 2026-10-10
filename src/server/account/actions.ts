"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type FormState, fieldErrors } from "@/lib/form";

import { audit } from "../audit";
import { requireUser } from "../auth/guards";
import { hashPassword, passwordSchema, verifyPassword } from "../auth/password";
import { createSession, revokeAllSessions } from "../auth/session";
import { db } from "../db";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(80),
  lastName: z.string().trim().min(1, "Enter your last name.").max(80),
  level: z.enum(["PCP", "ACP", "CCP", "EMR", "STUDENT", "OTHER", ""]),
  yearsExperience: z.union([z.literal(""), z.coerce.number().int().min(0).max(60)]),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      level: d.level || null,
      yearsExperience: d.yearsExperience === "" ? null : d.yearsExperience,
    },
  });
  await audit(user, "user.update", { type: "User", id: user.id }, { self: true });
  revalidatePath("/app", "layout");
  return { ok: true, message: "Saved." };
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
