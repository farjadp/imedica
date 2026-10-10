import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { monthsBetween, parseArticle } from "./frontmatter";

const dir = join(process.cwd(), "content/blog");

describe("parseArticle", () => {
  it("parses a minimal file", () => {
    const a = parseArticle(`---\nmonth: 2025-01\ntitle: "A title: with a colon"\nslug: a-title\nexcerpt: ${"x".repeat(60)}\ncategory: training\n---\n\n## Body\n\n${"word ".repeat(60)}`);
    expect(a.month).toBe("2025-01");
    expect(a.title).toBe("A title: with a colon");
    expect(a.faq).toEqual([]);
  });

  it("rejects a file without frontmatter", () => {
    expect(() => parseArticle("## Just a body")).toThrow();
  });

  it("parses every article in the editorial calendar, one per month", () => {
    const files = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-.+\.md$/.test(f));
    const parsed = files.map((f) => ({ f, a: parseArticle(readFileSync(join(dir, f), "utf8")) }));
    for (const { f, a } of parsed) expect(f.startsWith(a.month)).toBe(true);
    const slugs = parsed.map((p) => p.a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(parsed.map((p) => p.a.month))).toEqual(new Set(monthsBetween("2025-01", "2026-12")));
  });
});

describe("monthsBetween", () => {
  it("spans a year boundary", () => {
    expect(monthsBetween("2025-11", "2026-02")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});
