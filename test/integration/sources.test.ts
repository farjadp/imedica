import { describe, expect, it } from "vitest";

import * as sources from "@/app/api/v1/sources/route";
import { DISCLAIMER_URL, SOURCES } from "@/server/citations/registry";

import { call, person } from "./helpers";

// The public list behind the app's Sources screen and the web Sources page.

describe("GET /api/v1/sources", () => {
  it("is public: no sign-in needed", async () => {
    const res = await call("GET", sources.GET);
    expect(res.status).toBe(200);
  });

  it("lists every source in id order with the disclaimer link", async () => {
    const res = await call("GET", sources.GET);
    expect(res.data).toEqual({ sources: Object.values(SOURCES), disclaimerUrl: DISCLAIMER_URL });
    expect(res.data.sources.map((s: { id: string }) => s.id)).toEqual(["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]);
    for (const s of res.data.sources) expect(s.url).toMatch(/^https:\/\//);
  });

  it("is the same for a signed-in learner: nothing about them in it", async () => {
    const medic = await person("PARAMEDIC");
    const res = await call("GET", sources.GET, { as: medic });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.data)).not.toContain(medic.id);
    expect(Object.keys(res.data).sort()).toEqual(["disclaimerUrl", "sources"]);
  });
});
