"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { type FormState, fieldErrors } from "@/lib/form";

import { audit } from "../audit";
import { db } from "../db";
import { sendEmail } from "../email";
import { clientIp, limited } from "../rate-limit";
import { env } from "../env";
import { homeFor } from "./home";
import { dummyHash, hashPassword, passwordSchema, verifyPassword } from "./password";
import { createSession, destroySession, getCurrentUser, revokeAllSessions } from "./session";
import { hashToken, newToken } from "./tokens";

const RESET_TTL_MS = 60 * 60 * 1000;

/** Only same-site relative paths, so `?next=` can't send people off-site. */
function safeNext(next: unknown): string | null {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter your email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const ip = await clientIp();
  if ((await limited(`login:${ip}`, 20, 15 * 60_000)) || (await limited(`login:${parsed.data.email}`, 8, 15 * 60_000))) {
    return { message: "Too many attempts. Wait fifteen minutes and try again." };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    include: { organization: { select: { active: true } } },
  });
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? (await dummyHash()));

  if (!user || !ok) {
    if (user) await audit({ id: user.id, role: user.role, organizationId: user.organizationId }, "auth.login_failed");
    return { message: "That email and password don't match an account." };
  }
  if (!user.active || (user.organization && !user.organization.active)) {
    return { message: "This account is turned off. Ask your training lead to restore it." };
  }

  await createSession(user.id);
  await audit({ id: user.id, role: user.role, organizationId: user.organizationId }, "auth.login");
  redirect(safeNext(formData.get("next")) ?? homeFor(user.role));
}

export async function logout() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit(user, "auth.logout");
  redirect("/login");
}

// ─── Invitations ────────────────────────────────────────────────────────────

const acceptSchema = z
  .object({
    token: z.string().min(20),
    firstName: z.string().trim().min(1, "Enter your first name.").max(80),
    lastName: z.string().trim().min(1, "Enter your last name.").max(80),
    level: z.enum(["PCP", "ACP", "CCP", "EMR", "STUDENT", "OTHER"]).optional().or(z.literal("")),
    yearsExperience: z.coerce.number().int().min(0).max(60).optional().or(z.literal("")),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "The passwords don't match." });

export async function acceptInvitation(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = acceptSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), message: "Check the highlighted fields." };
  const d = parsed.data;

  const invite = await db.invitation.findUnique({ where: { tokenHash: hashToken(d.token) } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return { message: "This invitation has expired or was already used. Ask for a new one." };
  }
  if (await db.user.findUnique({ where: { email: invite.email } })) {
    return { message: "An account already exists for this email. Sign in instead." };
  }

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: invite.email,
        passwordHash: await hashPassword(d.password),
        firstName: d.firstName,
        lastName: d.lastName,
        role: invite.role,
        level: d.level ? d.level : null,
        yearsExperience: d.yearsExperience === "" || d.yearsExperience === undefined ? null : d.yearsExperience,
        organizationId: invite.organizationId,
      },
    });
    await tx.invitation.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    return created;
  });

  await createSession(user.id);
  await audit({ id: user.id, role: user.role, organizationId: user.organizationId }, "user.join", {
    type: "Invitation",
    id: invite.id,
  });
  // A paramedic who joined on a phone belongs in the app, not the mobile web.
  if (user.role === "PARAMEDIC" && isPhone((await headers()).get("user-agent"))) redirect("/welcome");
  redirect(homeFor(user.role));
}

/** iPhone or Android phone (not a tablet or desktop browser). */
function isPhone(ua: string | null): boolean {
  return Boolean(ua && (/iPhone|iPod/.test(ua) || /Android.+Mobile/.test(ua)));
}

// ─── Password reset ─────────────────────────────────────────────────────────

const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email("Enter your email address.") });

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (await limited(`reset:${await clientIp()}`, 5, 15 * 60_000)) {
    return { message: "Too many requests. Wait fifteen minutes and try again." };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user?.active) {
    const token = newToken();
    await db.passwordResetToken.create({
      data: { tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    });
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your Imedica password",
        text: `Use this link within the next hour to choose a new password:\n\n${env().APP_URL}/reset-password/${token}\n\nIf you didn't ask for this, you can ignore this email.`,
      });
    } catch (error) {
      console.error("[auth] reset email failed", error);
    }
  }
  // Same answer either way, so this form can't be used to find accounts.
  return { ok: true };
}

const resetSchema = z
  .object({ token: z.string().min(20), password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "The passwords don't match." });

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    include: { user: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { message: "This reset link has expired. Request a new one." };
  }

  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await revokeAllSessions(record.userId);
  await audit(
    { id: record.user.id, role: record.user.role, organizationId: record.user.organizationId },
    "auth.password_reset",
  );
  return { ok: true };
}
