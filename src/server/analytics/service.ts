import "server-only";

import type { ScenarioCategory } from "@/generated/prisma/enums";

import { ORG_MANAGER_ROLES, HttpError, scopeOrganization } from "../auth/guards";
import type { CurrentUser } from "../auth/session";
import { db } from "../db";
import { K_ANONYMITY } from "../privacy/hash";
import { cohortKeyFor } from "../privacy/deidentify";

// ============================================================================
// Organization reporting. Reads only the analytics schema, only for the
// caller's own cohort, and withholds any figure behind fewer than
// K_ANONYMITY distinct people.
// ============================================================================

type Row = {
  anonymousHash: string;
  category: ScenarioCategory;
  scorePct: number;
  harmfulCount: number;
  missedRequired: number;
  completedWeek: Date;
  decisions: { actionCategory: string; outcome: string }[];
};

export type Suppressible<T> = { suppressed: true; people: number } | ({ suppressed: false; people: number } & T);

function distinct(rows: Row[]) {
  return new Set(rows.map((r) => r.anonymousHash)).size;
}

function guard<T>(rows: Row[], compute: () => T): Suppressible<T> {
  const people = distinct(rows);
  if (people < K_ANONYMITY) return { suppressed: true, people: Math.min(people, K_ANONYMITY - 1) };
  return { suppressed: false, people, ...compute() };
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

export async function organizationReport(user: CurrentUser, requestedOrgId?: string | null, days = 90) {
  if (!ORG_MANAGER_ROLES.includes(user.role)) throw new HttpError(403, "Only training leads can see team analytics.");
  const orgId = scopeOrganization(user, requestedOrgId);
  if (!orgId) throw new HttpError(400, "Choose an organization.");
  const cohortKey = cohortKeyFor(orgId)!;
  const since = new Date(Date.now() - days * 864e5);

  const rows: Row[] = await db.analyticsSession.findMany({
    where: { cohortKey, completedWeek: { gte: since } },
    select: {
      anonymousHash: true,
      category: true,
      scorePct: true,
      harmfulCount: true,
      missedRequired: true,
      completedWeek: true,
      decisions: { select: { actionCategory: true, outcome: true } },
    },
  });

  const overall = guard(rows, () => ({
    runs: rows.length,
    averageScore: avg(rows.map((r) => r.scorePct)),
    harmfulRate: Math.round((rows.filter((r) => r.harmfulCount > 0).length / rows.length) * 100),
    missedRequiredRate: Math.round((rows.filter((r) => r.missedRequired > 0).length / rows.length) * 100),
  }));

  const byCategory = [...groupBy(rows, (r) => r.category)].map(([category, group]) => ({
    category,
    ...guard(group, () => ({ runs: group.length, averageScore: avg(group.map((r) => r.scorePct)) })),
  }));
  byCategory.sort((a, b) => (a.suppressed ? 1 : 0) - (b.suppressed ? 1 : 0));

  const weekly = [...groupBy(rows, (r) => r.completedWeek.toISOString().slice(0, 10))]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, group]) => ({ week, ...guard(group, () => ({ averageScore: avg(group.map((r) => r.scorePct)) })) }));

  // Which kinds of action go wrong, counted over people who made them.
  const problemActions = [...groupBy(
    rows.flatMap((r) => r.decisions.map((d) => ({ ...d, who: r.anonymousHash }))),
    (d) => d.actionCategory,
  )]
    .map(([actionCategory, ds]) => {
      const people = new Set(ds.map((d) => d.who)).size;
      if (people < K_ANONYMITY) return { actionCategory, suppressed: true as const, people };
      const bad = ds.filter((d) => d.outcome === "HARMFUL" || d.outcome === "CRITICAL" || d.outcome === "SUBOPTIMAL");
      return { actionCategory, suppressed: false as const, people, problemRate: Math.round((bad.length / ds.length) * 100) };
    })
    .sort((a, b) => (b.suppressed ? -1 : b.problemRate) - (a.suppressed ? -1 : a.problemRate));

  return { organizationId: orgId, days, kAnonymity: K_ANONYMITY, overall, byCategory, weekly, problemActions };
}

function groupBy<T>(items: T[], key: (t: T) => string) {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    m.set(k, [...(m.get(k) ?? []), it]);
  }
  return m;
}
