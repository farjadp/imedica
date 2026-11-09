import { describe, expect, it } from "vitest";

import type { Source } from "@/server/citations/registry";

import { groupSources, mapScenarios } from "./sources-view";

const src = (id: string, kind: Source["kind"]): Source =>
  ({ id, title: `T ${id}`, publisher: "P", version: null, url: `https://x.test/${id}`, kind }) as Source;

const SOURCES = { a: src("a", "literature"), b: src("b", "guideline"), c: src("c", "guideline") } as Record<string, Source>;

describe("groupSources", () => {
  it("orders guidelines first and drops empty kinds", () => {
    const groups = groupSources(SOURCES);
    expect(groups.map((g) => g.kind)).toEqual(["guideline", "literature"]);
    expect(groups[0].sources.map((s) => s.id)).toEqual(["b", "c"]);
  });
});

describe("mapScenarios", () => {
  it("names rows by library title, skips unshipped slugs and unknown sources, sorts by name", () => {
    const rows = mapScenarios(
      {
        "z-slug": [{ sourceId: "b", section: "Seizure MD" }, { sourceId: "missing", section: null }],
        "a-slug": [{ sourceId: "missing", section: null }],
        "m-slug": [{ sourceId: "c", section: null }],
        "unshipped": [{ sourceId: "c", section: null }],
      },
      SOURCES,
      new Map([["z-slug", "Anaphylaxis"], ["a-slug", "Asthma"], ["m-slug", "Mixed"]]),
    );
    expect(rows.map((r) => r.name)).toEqual(["Anaphylaxis", "Mixed"]);
    expect(rows[0].refs).toEqual([{ source: SOURCES.b, section: "Seizure MD" }]);
  });
});
