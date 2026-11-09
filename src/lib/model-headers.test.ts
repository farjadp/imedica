import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

// Applies next.config.ts header rules the way Next does (path-to-regexp match,
// later rules win for the same key) and returns the headers for one path.
async function headersFor(pathname: string) {
  const rules = (await nextConfig.headers?.()) ?? [];
  const out: Record<string, string> = {};
  for (const rule of rules) {
    const match = getPathMatch(rule.source, { removeUnnamedParams: true, strict: true });
    if (match(pathname)) for (const h of rule.headers) out[h.key.toLowerCase()] = h.value;
  }
  return out;
}

describe("model file headers", () => {
  it.each([
    "/models/hemorrhage/v1/patient.usdz",
    "/ar-spike/models/placeholder-casualty.usdz",
    "/anywhere/else.usdz",
  ])("%s is served as model/vnd.usdz+zip", async (path) => {
    expect((await headersFor(path))["content-type"]).toBe("model/vnd.usdz+zip");
  });

  it.each(["/models/hemorrhage/v1/patient.glb", "/ar-spike/models/placeholder-casualty.glb"])(
    "%s is served as model/gltf-binary",
    async (path) => {
      expect((await headersFor(path))["content-type"]).toBe("model/gltf-binary");
    },
  );

  it("versioned model files cache for a year", async () => {
    const h = await headersFor("/models/hemorrhage/v1/patient.glb");
    expect(h["cache-control"]).toBe("public, max-age=31536000, immutable");
    expect(h["x-content-type-options"]).toBe("nosniff");
  });

  it("other pages get no model type and no long cache", async () => {
    const h = await headersFor("/app/scenarios/abc");
    expect(h["content-type"]).toBeUndefined();
    expect(h["cache-control"]).toBeUndefined();
  });
});
