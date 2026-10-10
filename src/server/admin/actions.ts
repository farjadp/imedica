"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type FormState, fieldErrors } from "@/lib/form";

import { audit } from "../audit";
import { CONTENT_ROLES, HttpError, ORG_MANAGER_ROLES, requireRole, scopeOrganization } from "../auth/guards";
import { revokeAllSessions } from "../auth/session";
import { hashToken, newToken } from "../auth/tokens";
import { db } from "../db";
import { sendEmail } from "../email";
import { env } from "../env";

const INVITE_DAYS = 7;

function failure(error: unknown): FormState {
  if (error instanceof HttpError) return { message: error.message };
  if (error instanceof z.ZodError) return { fieldErrors: fieldErrors(error), message: "Check the highlighted fields." };
  console.error("[admin] action failed", error);
  return { message: "Something went wrong. Try again." };
}

// ─── People ─────────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  role: z.enum(["PARAMEDIC", "INSTRUCTOR", "PHYSICIAN", "ADMIN"]),
  organizationId: z.string().optional(),
});

export type InviteResult = FormState & { link?: string };

export async function inviteUser(_prev: InviteResult, formData: FormData): Promise<InviteResult> {
  try {
    const user = await requireRole(ORG_MANAGER_ROLES);
    const input = inviteSchema.parse(Object.fromEntries(formData));

    if (user.role !== "ADMIN" && !["PARAMEDIC", "INSTRUCTOR"].includes(input.role)) {
      throw new HttpError(403, "Training leads can invite paramedics and instructors.");
    }
    const orgId = scopeOrganization(user, input.organizationId || null);
    if (!orgId) throw new HttpError(422, "Choose an organization.");

    const org = await db.organization.findUniqueOrThrow({ where: { id: orgId } });
    const [seats, pending] = await Promise.all([
      db.user.count({ where: { organizationId: orgId, active: true } }),
      db.invitation.count({ where: { organizationId: orgId, acceptedAt: null, expiresAt: { gt: new Date() } } }),
    ]);
    if (seats + pending >= org.seatLimit) {
      throw new HttpError(409, `${org.name} has used all ${org.seatLimit} seats. Deactivate someone or raise the limit.`);
    }
    if (await db.user.findUnique({ where: { email: input.email } })) {
      throw new HttpError(409, "Someone with that email already has an account.");
    }

    const token = newToken();
    const invite = await db.invitation.create({
      data: {
        email: input.email,
        role: input.role,
        organizationId: orgId,
        tokenHash: hashToken(token),
        invitedById: user.id,
        expiresAt: new Date(Date.now() + INVITE_DAYS * 864e5),
      },
    });
    const link = `${env().APP_URL}/invite/${token}`;
    try {
      await sendEmail({
        to: input.email,
        subject: `You're invited to Imedica by ${org.name}`,
        text: `${user.firstName} ${user.lastName} invited you to train on Imedica with ${org.name}.\n\nCreate your account within ${INVITE_DAYS} days:\n${link}`,
      });
    } catch (error) {
      console.error("[admin] invite email failed", error);
    }
    await audit(user, "user.invite", { type: "Invitation", id: invite.id }, { role: input.role });
    revalidatePath("/admin/people");
    return { ok: true, message: `Invitation sent to ${input.email}.`, link };
  } catch (error) {
    return failure(error);
  }
}

const roleSchema = z.object({ userId: z.string(), role: z.enum(["PARAMEDIC", "INSTRUCTOR", "PHYSICIAN", "ADMIN"]) });

async function loadManagedUser(userId: string) {
  const actor = await requireRole(ORG_MANAGER_ROLES);
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw new HttpError(404, "Person not found.");
  if (actor.role !== "ADMIN" && target.organizationId !== actor.organizationId) {
    throw new HttpError(404, "Person not found.");
  }
  if (target.id === actor.id) throw new HttpError(409, "You can't change your own account here.");
  return { actor, target };
}

export async function changeRole(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const { userId, role } = roleSchema.parse(Object.fromEntries(formData));
    const { actor, target } = await loadManagedUser(userId);
    if (actor.role !== "ADMIN" && !["PARAMEDIC", "INSTRUCTOR"].includes(role)) {
      throw new HttpError(403, "Training leads can set paramedic or instructor.");
    }
    await db.user.update({ where: { id: target.id }, data: { role } });
    await revokeAllSessions(target.id);
    await audit(actor, "user.update", { type: "User", id: target.id }, { role: { from: target.role, to: role } });
    revalidatePath("/admin/people");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function setActive(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const { userId, active } = z
      .object({ userId: z.string(), active: z.enum(["true", "false"]) })
      .parse(Object.fromEntries(formData));
    const { actor, target } = await loadManagedUser(userId);
    const on = active === "true";
    await db.user.update({ where: { id: target.id }, data: { active: on } });
    if (!on) await revokeAllSessions(target.id);
    await audit(actor, on ? "user.reactivate" : "user.deactivate", { type: "User", id: target.id });
    revalidatePath("/admin/people");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function revokeInvitation(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const actor = await requireRole(ORG_MANAGER_ROLES);
    const { invitationId } = z.object({ invitationId: z.string() }).parse(Object.fromEntries(formData));
    const invite = await db.invitation.findUnique({ where: { id: invitationId } });
    if (!invite || (actor.role !== "ADMIN" && invite.organizationId !== actor.organizationId)) {
      throw new HttpError(404, "Invitation not found.");
    }
    await db.invitation.delete({ where: { id: invite.id } });
    await audit(actor, "user.update", { type: "Invitation", id: invite.id }, { revoked: true });
    revalidatePath("/admin/people");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

// ─── Organizations (Imedica admins) ─────────────────────────────────────────

const orgSchema = z.object({
  name: z.string().trim().min(2, "Enter the organization's name.").max(160),
  type: z.enum(["EMS_SERVICE", "FIRE_SERVICE", "HOSPITAL", "COLLEGE", "LONG_TERM_CARE", "OTHER"]),
  province: z.string().trim().length(2, "Use the two-letter province code."),
  seatLimit: z.coerce.number().int().min(1).max(5000),
});

export async function createOrganization(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const actor = await requireRole(["ADMIN"]);
    const input = orgSchema.parse(Object.fromEntries(formData));
    const base = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    let slug = base;
    for (let n = 2; await db.organization.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;
    const org = await db.organization.create({ data: { ...input, province: input.province.toUpperCase(), slug } });
    await audit(actor, "org.create", { type: "Organization", id: org.id }, { name: org.name });
    revalidatePath("/admin/organizations");
    return { ok: true, message: `${org.name} created. Invite its first training lead from People.` };
  } catch (error) {
    return failure(error);
  }
}

export async function updateOrganization(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const actor = await requireRole(["ADMIN"]);
    const { organizationId, seatLimit, active } = z
      .object({
        organizationId: z.string(),
        seatLimit: z.coerce.number().int().min(1).max(5000).optional(),
        active: z.enum(["true", "false"]).optional(),
      })
      .parse(Object.fromEntries(formData));
    await db.organization.update({
      where: { id: organizationId },
      data: { ...(seatLimit ? { seatLimit } : {}), ...(active ? { active: active === "true" } : {}) },
    });
    await audit(actor, "org.update", { type: "Organization", id: organizationId }, { seatLimit, active });
    revalidatePath("/admin/organizations");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

// ─── AI review (physicians) ─────────────────────────────────────────────────

export async function reviewExplanation(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const actor = await requireRole(CONTENT_ROLES);
    const { feedbackId, decision, note } = z
      .object({
        feedbackId: z.string(),
        decision: z.enum(["APPROVED", "FLAGGED"]),
        note: z.string().trim().max(1000).optional(),
      })
      .parse(Object.fromEntries(formData));
    await db.aiFeedback.update({
      where: { id: feedbackId },
      data: { review: decision, reviewNote: note || null, reviewerId: actor.id, reviewedAt: new Date() },
    });
    await audit(actor, "ai.review", { type: "AiFeedback", id: feedbackId }, { decision });
    revalidatePath("/admin/ai");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function markLeadHandled(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await requireRole(["ADMIN"]);
    const { id } = z.object({ id: z.string() }).parse(Object.fromEntries(formData));
    await db.demoRequest.update({ where: { id }, data: { handled: true } });
    revalidatePath("/admin/leads");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
