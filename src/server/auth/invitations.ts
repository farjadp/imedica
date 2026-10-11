import "server-only";
import { z } from "zod";

import type { User } from "@/generated/prisma/client";

import { audit } from "../audit";
import { db } from "../db";
import { HttpError } from "./guards";
import { hashPassword, passwordSchema } from "./password";
import { hashToken } from "./tokens";

// Joining from an invitation. The web form (server action) and the app
// (/api/v1/invitations/:token/accept) both come through here.

export const acceptSchema = z
  .object({
    firstName: z.string().trim().min(1, "Enter your first name.").max(80),
    lastName: z.string().trim().min(1, "Enter your last name.").max(80),
    level: z.enum(["PCP", "ACP", "CCP", "EMR", "STUDENT", "OTHER"]).optional().or(z.literal("")),
    yearsExperience: z.coerce.number().int().min(0).max(60).optional().or(z.literal("")),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "The passwords don't match." });

export type AcceptInput = z.infer<typeof acceptSchema>;

async function usableInvite(token: string) {
  const invite = await db.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { organization: { select: { name: true, active: true } } },
  });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date() || !invite.organization.active) return null;
  return invite;
}

/** What the join screen shows. An unusable token says only that, nothing about whose it was. */
export async function describeInvite(token: string) {
  const invite = await usableInvite(token);
  if (!invite) throw new HttpError(404, "This invitation has expired or was already used. Ask your training lead for a new one.");
  return {
    email: invite.email,
    role: invite.role,
    organizationName: invite.organization.name,
    expiresAt: invite.expiresAt.toISOString(),
  };
}

/** Creates the account and marks the invitation used. Throws HttpError for anything a person can fix. */
export async function acceptInvite(token: string, input: AcceptInput): Promise<User> {
  const invite = await usableInvite(token);
  if (!invite) throw new HttpError(410, "This invitation has expired or was already used. Ask for a new one.");
  if (await db.user.findUnique({ where: { email: invite.email } })) {
    throw new HttpError(409, "An account already exists for this email. Sign in instead.");
  }

  const user = await db.$transaction(async (tx) => {
    // Claim the invitation first, so two submissions can't both create an account.
    const claimed = await tx.invitation.updateMany({ where: { id: invite.id, acceptedAt: null }, data: { acceptedAt: new Date() } });
    if (claimed.count === 0) throw new HttpError(410, "This invitation was already used.");
    return tx.user.create({
      data: {
        email: invite.email,
        passwordHash: await hashPassword(input.password),
        firstName: input.firstName,
        lastName: input.lastName,
        role: invite.role,
        level: input.level ? input.level : null,
        yearsExperience: input.yearsExperience === "" || input.yearsExperience === undefined ? null : input.yearsExperience,
        organizationId: invite.organizationId,
      },
    });
  });

  await audit({ id: user.id, role: user.role, organizationId: user.organizationId }, "user.join", {
    type: "Invitation",
    id: invite.id,
  });
  return user;
}
