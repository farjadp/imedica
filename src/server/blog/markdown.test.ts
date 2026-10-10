import { describe, expect, it } from "vitest";

import { readingMinutes, renderMarkdown, slugify } from "./markdown";

describe("renderMarkdown", () => {
  it("escapes raw HTML instead of rendering it", () => {
    const { html } = renderMarkdown('Hello <script>alert(1)</script>\n\n<img src=x onerror="alert(1)">');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("drops unsafe link and image protocols", () => {
    const { html } = renderMarkdown("[x](javascript:alert(1)) ![y](http://plain.example/a.png)");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("http://plain.example");
  });

  it("opens outbound links safely", () => {
    const { html } = renderMarkdown("[CPR](https://www.heartandstroke.ca)");
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("builds a table of contents with unique ids, demoting h1 to h2", () => {
    const { html, toc } = renderMarkdown("# Airway\n\ntext\n\n## Airway\n\n### Bag-valve mask\n\n#### Deep");
    expect(toc).toEqual([
      { id: "airway", text: "Airway", depth: 2 },
      { id: "airway-1", text: "Airway", depth: 2 },
      { id: "bag-valve-mask", text: "Bag-valve mask", depth: 3 },
    ]);
    expect(html).not.toContain("<h1");
    expect(html).toContain('<h4 id="deep">');
  });
});

describe("slugify", () => {
  it("makes URL-safe slugs", () => {
    expect(slugify("  Anaphylaxis: Épinéphrine first!  ")).toBe("anaphylaxis-epinephrine-first");
  });
});

describe("readingMinutes", () => {
  it("never reports zero", () => {
    expect(readingMinutes("short")).toBe(1);
    expect(readingMinutes("word ".repeat(1100))).toBe(5);
  });
});
