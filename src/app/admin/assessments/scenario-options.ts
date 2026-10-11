import "server-only";

import { db } from "@/server/db";

/** Published scenarios an assessment can include, plus any it already lists. */
export async function scenarioOptions(extraIds: string[] = []) {
  return db.scenario.findMany({
    where: { OR: [{ status: "PUBLISHED" }, { id: { in: extraIds } }] },
    orderBy: [{ category: "asc" }, { title: "asc" }],
    select: { id: true, title: true, category: true, difficulty: true },
  });
}
