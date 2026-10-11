import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import type { CurrentUser } from "./auth/session";
import { db } from "./db";

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.password_reset"
  | "account.delete"
  | "user.invite"
  | "user.join"
  | "user.update"
  | "user.deactivate"
  | "user.reactivate"
  | "org.create"
  | "org.update"
  | "scenario.create"
  | "scenario.update"
  | "scenario.submit"
  | "scenario.publish"
  | "scenario.archive"
  | "scenario.delete"
  | "assessment.create"
  | "assessment.update"
  | "assessment.submit"
  | "assessment.publish"
  | "assessment.window_open"
  | "assessment.window_close"
  | "assessment.start"
  | "assessment.complete"
  | "ai.review"
  | "demo.request"
  | "blog.create"
  | "blog.update"
  | "blog.status"
  | "blog.delete"
  | "bank.import"
  | "calls.import"
  | "blog.image_upload"
  | "blog.category"
  | "inbox.receive"
  | "inbox.handle";

/** Never throws: a failed audit write must not break the action it records. */
export async function audit(
  actor: Pick<CurrentUser, "id" | "role" | "organizationId"> | null,
  action: AuditAction,
  target?: { type: string; id: string },
  metadata?: Prisma.InputJsonValue,
) {
  try {
    await db.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorRole: actor?.role ?? null,
        organizationId: actor?.organizationId ?? null,
        action,
        targetType: target?.type ?? null,
        targetId: target?.id ?? null,
        metadata,
      },
    });
  } catch (error) {
    console.error("[audit] write failed", action, error);
  }
}
