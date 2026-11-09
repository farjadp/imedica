import { describe, expect, it } from "vitest";

import { arModelSchema, hotspotSchema, resolveModelUrl } from "./ar-model";

const valid = {
  glbUrl: "/models/hemorrhage/v1/patient.glb",
  usdzUrl: "/models/hemorrhage/v1/patient.usdz",
  posterUrl: "/models/hemorrhage/v1/poster.webp",
  heightMeters: 1.75,
  licence: "CC0-1.0",
  source: "Quaternius, Ultimate Modular Men (Casual.glb)",
};

describe("hotspotSchema", () => {
  it("accepts a named node, label and region, with or without an action", () => {
    expect(hotspotSchema.parse({ node: "wound_thigh_left", label: "Left thigh wound", region: "left_leg" })).toEqual({
      node: "wound_thigh_left",
      label: "Left thigh wound",
      region: "left_leg",
    });
    expect(hotspotSchema.parse({ node: "chest", label: "Chest", region: "chest", action: "act_123" }).action).toBe("act_123");
  });

  it.each([
    [{ node: "Wound Thigh", label: "x", region: "left_leg" }, "node"],
    [{ node: "", label: "x", region: "left_leg" }, "node"],
    [{ node: "chest", label: "", region: "chest" }, "label"],
    [{ node: "chest", label: "Chest", region: "torso_somewhere" }, "region"],
    [{ node: "chest", label: "Chest" }, "region"],
  ])("rejects %j (bad %s)", (input, field) => {
    const r = hotspotSchema.safeParse(input);
    expect(r.success).toBe(false);
    expect(r.error?.issues.some((i) => i.path[0] === field)).toBe(true);
  });

  it("rejects unknown keys so v2 doesn't inherit junk", () => {
    expect(hotspotSchema.safeParse({ node: "chest", label: "Chest", region: "chest", colour: "red" }).success).toBe(false);
  });
});

describe("arModelSchema", () => {
  it("accepts site paths and https URLs, and defaults hotspots to empty", () => {
    const parsed = arModelSchema.parse({ ...valid, glbUrl: "https://cdn.example.com/p.glb" });
    expect(parsed.hotspots).toEqual([]);
  });

  it.each([
    ["glbUrl", "http://insecure.example.com/p.glb"],
    ["glbUrl", "/models/p.usdz"],
    ["usdzUrl", "/models/p.glb"],
    ["usdzUrl", "javascript:alert(1)"],
    ["glbUrl", "models/no-leading-slash.glb"],
    ["glbUrl", "//evil.example.com/p.glb"],
    ["heightMeters", 0],
    ["heightMeters", 4],
    ["licence", ""],
    ["source", ""],
  ])("rejects %s = %j", (field, value) => {
    const r = arModelSchema.safeParse({ ...valid, [field]: value });
    expect(r.success).toBe(false);
  });

  it("rejects two hotspots on the same node", () => {
    const h = { node: "chest", label: "Chest", region: "chest" };
    expect(arModelSchema.safeParse({ ...valid, hotspots: [h, h] }).success).toBe(false);
  });
});

describe("resolveModelUrl", () => {
  it("makes site paths absolute so a phone can open them", () => {
    expect(resolveModelUrl("/models/a/v1/p.usdz", "https://www.imedica.tech")).toBe(
      "https://www.imedica.tech/models/a/v1/p.usdz",
    );
  });
  it("leaves absolute URLs alone", () => {
    expect(resolveModelUrl("https://cdn.example.com/p.glb", "https://www.imedica.tech")).toBe("https://cdn.example.com/p.glb");
  });
});
