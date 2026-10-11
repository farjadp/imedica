import "server-only";

import { db } from "../../db";

import { LIBRARY } from ".";

// Not in actions.ts: every export of a "use server" file can be called from
// the browser, and this one returns rule content.

/** Library scenarios not yet in this database, matched by slug. */
export async function missingFromLibrary() {
  const have = await db.scenario.findMany({ where: { slug: { in: LIBRARY.map((d) => d.slug) } }, select: { slug: true } });
  const slugs = new Set(have.map((s) => s.slug));
  return LIBRARY.filter((d) => !slugs.has(d.slug));
}
