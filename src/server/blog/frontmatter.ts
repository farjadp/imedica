// Parses an editorial-calendar article file (YAML frontmatter + Markdown).
// Pure, so it's testable.

import YAML from "yaml";
import { z } from "zod";

const schema = z.object({
  month: z.coerce.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must be YYYY-MM"),
  title: z.string().min(8),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().min(40).max(320),
  keyTakeaway: z.string().max(600).optional(),
  category: z.enum(["case-breakdowns", "protocols", "training", "privacy-data", "product"]),
  tags: z.array(z.coerce.string()).max(10).default([]),
  focusKeyword: z.string().optional(),
  metaDescription: z.string().max(170).optional(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  sources: z.array(z.object({ title: z.string(), url: z.url() })).default([]),
});

export type CalendarArticle = z.infer<typeof schema> & { body: string };

export function parseArticle(source: string): CalendarArticle {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error("No frontmatter block");
  const data = schema.parse(YAML.parse(m[1]));
  const body = m[2].trim();
  if (body.length < 200) throw new Error("Body is too short");
  return { ...data, tags: data.tags.map((t) => t.toLowerCase()), body };
}

/** Every month from start to end inclusive, as YYYY-MM. */
export function monthsBetween(start: string, end: string): string[] {
  const out: string[] = [];
  let [y, mo] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  while (y < ey || (y === ey && mo <= em)) {
    out.push(`${y}-${String(mo).padStart(2, "0")}`);
    mo += 1;
    if (mo > 12) {
      mo = 1;
      y += 1;
    }
  }
  return out;
}
