import "server-only";
import { z } from "zod";

import { audit } from "../audit";
import { HttpError, ORG_MANAGER_ROLES, scopeOrganization } from "../auth/guards";
import type { CurrentUser } from "../auth/session";
import { db } from "../db";
import { cohortKeyFor } from "../privacy/deidentify";
import { K_ANONYMITY } from "../privacy/hash";

// ============================================================================
// Assessment windows. A training lead opens the pre-test for their service,
// later the post-test. Opening the post-test closes the pre-test, so nobody
// takes the baseline after training has started.
// ============================================================================

const openSchema = z.object({
  assessmentId: z.string().min(1),
  phase: z.enum(["PRE", "POST"]),
  organizationId: z.string().optional(),
});

function assertManager(user: CurrentUser) {
  if (!ORG_MANAGER_ROLES.includes(user.role)) throw new HttpError(403, "Only training leads can manage assessments.");
}

function orgFor(user: CurrentUser, requested?: string | null) {
  const orgId = scopeOrganization(user, requested);
  if (!orgId) throw new HttpError(400, "Choose an organization.");
  return orgId;
}

export function isOpen(w: { opensAt: Date; closesAt: Date | null }, now = new Date()) {
  return w.opensAt <= now && (!w.closesAt || w.closesAt > now);
}

/** Completions below K are reported as "fewer than K", never as a number. */
function guardedCount(n: number) {
  return n >= K_ANONYMITY ? { completed: n, suppressed: false as const } : { completed: null, suppressed: true as const };
}

/** Every published assessment with this service's PRE and POST windows. */
export async function listWindows(user: CurrentUser, requestedOrgId?: string | null) {
  assertManager(user);
  const orgId = orgFor(user, requestedOrgId);
  const cohortKey = cohortKeyFor(orgId);

  const [assessments, windows] = await Promise.all([
    db.assessment.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, summary: true, scenarioIds: true, _count: { select: { questions: true } } },
    }),
    db.assessmentWindow.findMany({ where: { organizationId: orgId } }),
  ]);
  const completions = await db.assessmentAttempt.groupBy({
    by: ["windowId"],
    where: { windowId: { in: windows.map((w) => w.id) }, cohortKey, completedAt: { not: null } },
    _count: { _all: true },
  });
  const doneBy = new Map(completions.map((c) => [c.windowId, c._count._all]));

  const view = (w: (typeof windows)[number] | undefined) =>
    w
      ? {
          id: w.id,
          opensAt: w.opensAt,
          closesAt: w.closesAt,
          open: isOpen(w),
          ...guardedCount(doneBy.get(w.id) ?? 0),
        }
      : null;

  // Windows stay listed even if their assessment was later unpublished.
  const ids = new Set([...assessments.map((a) => a.id), ...windows.map((w) => w.assessmentId)]);
  const extra = await db.assessment.findMany({
    where: { id: { in: [...ids].filter((id) => !assessments.some((a) => a.id === id)) } },
    select: { id: true, title: true, summary: true, scenarioIds: true, _count: { select: { questions: true } } },
  });

  return {
    organizationId: orgId,
    kAnonymity: K_ANONYMITY,
    assessments: [...assessments, ...extra].map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.summary,
      scenarioCount: a.scenarioIds.length,
      questionCount: a._count.questions,
      pre: view(windows.find((w) => w.assessmentId === a.id && w.phase === "PRE")),
      post: view(windows.find((w) => w.assessmentId === a.id && w.phase === "POST")),
    })),
  };
}

export async function openWindow(user: CurrentUser, body: unknown) {
  assertManager(user);
  const input = openSchema.parse(body);
  const orgId = orgFor(user, input.organizationId);

  const assessment = await db.assessment.findUnique({ where: { id: input.assessmentId }, select: { status: true } });
  if (!assessment || assessment.status !== "PUBLISHED") throw new HttpError(404, "Assessment not found.");

  const existing = await db.assessmentWindow.findMany({ where: { organizationId: orgId, assessmentId: input.assessmentId } });
  if (existing.some((w) => w.phase === input.phase)) {
    throw new HttpError(409, `The ${input.phase === "PRE" ? "pre" : "post"}-test has already been opened for this service.`);
  }
  const pre = existing.find((w) => w.phase === "PRE");
  if (input.phase === "POST" && !pre) throw new HttpError(409, "Open the pre-test first.");

  const now = new Date();
  const window = await db.$transaction(async (tx) => {
    if (pre && isOpen(pre, now)) {
      await tx.assessmentWindow.update({ where: { id: pre.id }, data: { closesAt: now } });
    }
    return tx.assessmentWindow.create({
      data: { organizationId: orgId, assessmentId: input.assessmentId, phase: input.phase, opensAt: now, openedById: user.id },
    });
  });
  await audit(user, "assessment.window_open", { type: "AssessmentWindow", id: window.id }, { phase: input.phase });
  return window;
}

export async function closeWindow(user: CurrentUser, windowId: string) {
  assertManager(user);
  const window = await db.assessmentWindow.findUnique({ where: { id: windowId } });
  // Another service's window looks exactly like a missing one.
  if (!window || (user.role !== "ADMIN" && window.organizationId !== user.organizationId)) {
    throw new HttpError(404, "Window not found.");
  }
  if (!isOpen(window)) return window;
  const closed = await db.assessmentWindow.update({ where: { id: windowId }, data: { closesAt: new Date() } });
  await audit(user, "assessment.window_close", { type: "AssessmentWindow", id: windowId }, { phase: window.phase });
  return closed;
}
