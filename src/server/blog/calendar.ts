import "server-only";

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { db } from "../db";
import { type CalendarArticle, monthsBetween, parseArticle } from "./frontmatter";

export const CALENDAR = { start: "2025-01", end: "2026-12" } as const;
const DIR = join(process.cwd(), "content/blog");

export type CalendarFile = { file: string; article?: CalendarArticle; error?: string };

export async function readCalendarFiles(): Promise<CalendarFile[]> {
  let names: string[] = [];
  try {
    names = (await readdir(DIR)).filter((f) => /^\d{4}-\d{2}-.+\.md$/.test(f)).sort();
  } catch {
    return [];
  }
  return Promise.all(
    names.map(async (file) => {
      try {
        return { file, article: parseArticle(await readFile(join(DIR, file), "utf8")) };
      } catch (error) {
        return { file, error: (error as Error).message.slice(0, 200) };
      }
    }),
  );
}

/** One row per month: the planned article (if any) and the post it became (if any). */
export async function getCalendar() {
  const [files, posts] = await Promise.all([
    readCalendarFiles(),
    db.blogPost.findMany({
      where: { plannedFor: { not: null } },
      select: { id: true, slug: true, title: true, status: true, publishedAt: true, plannedFor: true },
    }),
  ]);
  return monthsBetween(CALENDAR.start, CALENDAR.end).map((month) => ({
    month,
    file: files.find((f) => f.file.startsWith(month) && !f.article?.extra),
    post: posts.find((p) => p.plannedFor === month),
  }));
}
