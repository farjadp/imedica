import { describe, expect, it } from "vitest";

import { LIBRARY } from "../scenarios/library";

import { DISCLAIMER_URL, SCENARIO_SOURCES, SOURCES, sourcesForSlug } from "./registry";

describe("citation registry", () => {
  it("keys every source by its own id", () => {
    for (const [key, source] of Object.entries(SOURCES)) expect(source.id).toBe(key);
  });

  it("links every source over https", () => {
    for (const source of Object.values(SOURCES)) expect(new URL(source.url).protocol, source.id).toBe("https:");
    expect(new URL(DISCLAIMER_URL).protocol).toBe("https:");
  });

  it("gives every library scenario at least one source", () => {
    for (const def of LIBRARY) expect(sourcesForSlug(def.slug).length, def.slug).toBeGreaterThan(0);
  });

  it("covers the BLS arrest scenarios before they merge", () => {
    expect(sourcesForSlug("adult-bls-cardiac-arrest-vf").map((s) => s.id)).toEqual(["S4"]);
    expect(sourcesForSlug("paediatric-bls-arrest-two-rescuers").map((s) => s.id)).toEqual(["S5"]);
  });

  it("only points at sources that exist", () => {
    for (const [slug, refs] of Object.entries(SCENARIO_SOURCES)) {
      for (const ref of refs) expect(SOURCES[ref.sourceId], `${slug} → ${ref.sourceId}`).toBeDefined();
    }
  });

  it("resolves a slug to display rows with the section", () => {
    expect(sourcesForSlug("inferior-stemi-rv-involvement")).toEqual([
      { ...pick("S1"), section: "Cardiac Ischemia Medical Directive" },
      { ...pick("S2"), section: "STEMI Hospital Bypass Protocol" },
    ]);
  });

  it("returns nothing for an unknown slug, including prototype keys", () => {
    expect(sourcesForSlug("nope")).toEqual([]);
    expect(sourcesForSlug("constructor")).toEqual([]);
  });
});

function pick(id: keyof typeof SOURCES) {
  const { title, publisher, version, url } = SOURCES[id];
  return { id, title, publisher, version, url };
}
