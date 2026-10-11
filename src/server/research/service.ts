import "server-only";

import type { CurrentUser } from "../auth/session";
import { HttpError } from "../auth/guards";
import { db } from "../db";
import { limited } from "../rate-limit";

import { findBrief, getOrCreateBrief } from "./brief";
import { assertPaperRef, getPaper, searchPapers } from "./europepmc";

export async function search(user: CurrentUser, url: URL) {
  if (await limited(`papers-search:${user.id}`, 60, 60 * 1000)) {
    throw new HttpError(429, "That's a lot of searches. Give it a minute.");
  }
  const found = await searchPapers({
    q: url.searchParams.get("q") ?? "",
    cursor: url.searchParams.get("cursor"),
    openAccessOnly: url.searchParams.get("open") === "1",
  });
  const saved = await savedKeys(user.id);
  return { ...found, results: found.results.map((r) => ({ ...r, saved: saved.has(`${r.source}:${r.extId}`) })) };
}

export async function detail(user: CurrentUser, source: string, extId: string) {
  const [paper, brief, saved] = await Promise.all([
    getPaper(source, extId),
    findBrief(source, extId),
    db.savedPaper.findUnique({ where: { userId_source_extId: { userId: user.id, source, extId } }, select: { id: true } }),
  ]);
  return { ...paper, saved: Boolean(saved), brief };
}

export async function brief(user: CurrentUser, source: string, extId: string) {
  assertPaperRef(source, extId);
  // Cached briefs are free; only new ones count against the limit.
  const cached = await findBrief(source, extId);
  if (cached) return cached;
  if (await limited(`papers-brief:${user.id}`, 20, 60 * 60 * 1000)) {
    throw new HttpError(429, "You've had 20 new summaries this hour. Try again later.");
  }
  return getOrCreateBrief(source, extId);
}

async function savedKeys(userId: string) {
  const rows = await db.savedPaper.findMany({ where: { userId }, select: { source: true, extId: true } });
  return new Set(rows.map((r) => `${r.source}:${r.extId}`));
}

export async function listSaved(user: CurrentUser) {
  const rows = await db.savedPaper.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 200 });
  return rows.map((r) => ({ source: r.source, extId: r.extId, title: r.title, journal: r.journal, year: r.year, savedAt: r.createdAt }));
}

export async function save(user: CurrentUser, source: string, extId: string) {
  const paper = await getPaper(source, extId);
  await db.savedPaper.upsert({
    where: { userId_source_extId: { userId: user.id, source, extId } },
    create: { userId: user.id, source, extId, title: paper.title.slice(0, 500), journal: paper.journal, year: paper.year },
    update: {},
  });
  return { saved: true };
}

export async function unsave(user: CurrentUser, source: string, extId: string) {
  assertPaperRef(source, extId);
  await db.savedPaper.deleteMany({ where: { userId: user.id, source, extId } });
  return { saved: false };
}
