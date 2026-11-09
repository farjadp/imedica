import { beforeAll, describe, expect, it } from "vitest";

import * as review from "@/app/api/v1/scenarios/[id]/ar-models/[modelId]/review/route";
import * as models from "@/app/api/v1/scenarios/[id]/ar-models/route";
import * as one from "@/app/api/v1/scenarios/[id]/route";
import { db } from "@/server/db";

import { type Person, call, person, scenario } from "./helpers";

// A scenario's 3D casualty: physicians attach versions, a second physician signs
// each off, and learners only ever get the newest reviewed one.

let admin: Person;
let author: Person;
let reviewer: Person;
let medic: Person;

beforeAll(async () => {
  admin = await person("ADMIN");
  author = await person("PHYSICIAN");
  reviewer = await person("PHYSICIAN");
  medic = await person("PARAMEDIC");
});

const model = (v = 1) => ({
  glbUrl: `/models/test/v${v}/patient.glb`,
  usdzUrl: `/models/test/v${v}/patient.usdz`,
  posterUrl: `/models/test/v${v}/poster.webp`,
  heightMeters: 1.75,
  licence: "CC0-1.0",
  source: "Quaternius, Ultimate Modular Men",
});

async function attach(scenarioId: string, body: unknown = model(), as: Person = author) {
  return call("POST", models.POST, { as, params: { id: scenarioId }, body });
}
async function approve(scenarioId: string, modelId: string, as: Person = reviewer) {
  return call("POST", review.POST, { as, params: { id: scenarioId, modelId }, body: { action: "approve" } });
}
async function brief(scenarioId: string) {
  return call("GET", one.GET, { as: medic, params: { id: scenarioId } });
}

describe("attaching a model", () => {
  it("is for physicians and admins only", async () => {
    const s = await scenario(author.id, "PUBLISHED");
    expect((await attach(s.id, model(), medic)).status).toBe(403);
    expect(await db.scenarioArModel.count({ where: { scenarioId: s.id } })).toBe(0);
  });

  it("adds an unreviewed version, numbered per scenario", async () => {
    const s = await scenario(author.id);
    const first = await attach(s.id);
    expect(first.status).toBe(201);
    expect(first.data).toMatchObject({ version: 1, reviewerId: null, reviewedAt: null, hotspots: [], createdById: author.id });
    const second = await attach(s.id, model(2));
    expect(second.data.version).toBe(2);
  });

  it("validates the hotspot shape", async () => {
    const s = await scenario(author.id);
    const bad = await attach(s.id, { ...model(), hotspots: [{ node: "Left Thigh!", label: "Thigh", region: "leg" }] });
    expect(bad.status).toBe(422);
    const ok = await attach(s.id, {
      ...model(),
      hotspots: [{ node: "wound_thigh_left", label: "Left thigh wound", region: "left_leg" }],
    });
    expect(ok.status).toBe(201);
    expect(ok.data.hotspots).toEqual([{ node: "wound_thigh_left", label: "Left thigh wound", region: "left_leg" }]);
  });

  it("a hotspot's action must be one of this scenario's actions", async () => {
    const s = await scenario(author.id);
    const other = await scenario(author.id);
    const hs = (action: string) => ({ ...model(), hotspots: [{ node: "chest", label: "Chest", region: "chest", action }] });
    expect((await attach(s.id, hs(other.actions.ecg.id))).status).toBe(422);
    expect((await attach(s.id, hs(s.actions.ecg.id))).status).toBe(201);
  });

  it("rejects non-https and wrong-extension files", async () => {
    const s = await scenario(author.id);
    expect((await attach(s.id, { ...model(), usdzUrl: "http://cdn.example.com/p.usdz" })).status).toBe(422);
    expect((await attach(s.id, { ...model(), glbUrl: "/models/p.usdz" })).status).toBe(422);
  });
});

describe("physician review (two-person rule)", () => {
  it("the physician who attached a model can't sign it off", async () => {
    const s = await scenario(author.id, "PUBLISHED");
    const m = await attach(s.id);
    expect((await approve(s.id, m.data.id, author)).status).toBe(403);
  });

  it("a learner can't review", async () => {
    const s = await scenario(author.id, "PUBLISHED");
    const m = await attach(s.id);
    expect((await approve(s.id, m.data.id, medic)).status).toBe(403);
  });

  it("a second physician can, and is recorded", async () => {
    const s = await scenario(author.id, "PUBLISHED");
    const m = await attach(s.id);
    const res = await approve(s.id, m.data.id);
    expect(res.status).toBe(201);
    expect(res.data.reviewerId).toBe(reviewer.id);
    expect(res.data.reviewedAt).not.toBeNull();
  });

  it("an admin can sign off their own upload", async () => {
    const s = await scenario(author.id, "PUBLISHED");
    const m = await attach(s.id, model(), admin);
    expect((await approve(s.id, m.data.id, admin)).status).toBe(201);
  });

  it("a model from another scenario looks missing", async () => {
    const s = await scenario(author.id, "PUBLISHED");
    const other = await scenario(author.id, "PUBLISHED");
    const m = await attach(other.id);
    expect((await approve(s.id, m.data.id)).status).toBe(404);
  });
});

describe("what learners get in the brief", () => {
  it("no model: arModel is null and every old field is still there", async () => {
    const s = await scenario(author.id, "PUBLISHED");
    const res = await brief(s.id);
    expect(res.status).toBe(200);
    expect(res.data.arModel).toBeNull();
    for (const key of ["id", "title", "summary", "dispatch", "category", "difficulty", "timeLimitSec", "learningGoals", "protocolSource", "publishedAt", "sources"]) {
      expect(res.data).toHaveProperty(key);
    }
  });

  it("an unreviewed model is never served", async () => {
    const s = await scenario(author.id, "PUBLISHED");
    await attach(s.id);
    expect((await brief(s.id)).data.arModel).toBeNull();
  });

  it("a reviewed model is served with absolute URLs, size, attribution and hotspots", async () => {
    const s = await scenario(author.id, "PUBLISHED");
    const m = await attach(s.id);
    await approve(s.id, m.data.id);
    expect((await brief(s.id)).data.arModel).toEqual({
      id: m.data.id,
      version: 1,
      glbUrl: "http://localhost:3000/models/test/v1/patient.glb",
      usdzUrl: "http://localhost:3000/models/test/v1/patient.usdz",
      posterUrl: "http://localhost:3000/models/test/v1/poster.webp",
      heightMeters: 1.75,
      attribution: { licence: "CC0-1.0", source: "Quaternius, Ultimate Modular Men" },
      hotspots: [],
    });
  });

  it("a newer unreviewed version doesn't replace the reviewed one until it is signed off", async () => {
    const s = await scenario(author.id, "PUBLISHED");
    const v1 = await attach(s.id);
    await approve(s.id, v1.data.id);
    const v2 = await attach(s.id, model(2));
    expect((await brief(s.id)).data.arModel.version).toBe(1);
    await approve(s.id, v2.data.id);
    expect((await brief(s.id)).data.arModel.version).toBe(2);
  });

  it("revoking a review stops serving that version", async () => {
    const s = await scenario(author.id, "PUBLISHED");
    const m = await attach(s.id);
    await approve(s.id, m.data.id);
    const res = await call("POST", review.POST, { as: reviewer, params: { id: s.id, modelId: m.data.id }, body: { action: "revoke" } });
    expect(res.status).toBe(201);
    expect((await brief(s.id)).data.arModel).toBeNull();
  });

  it("learners can't list a scenario's model versions", async () => {
    const s = await scenario(author.id, "PUBLISHED");
    expect((await call("GET", models.GET, { as: medic, params: { id: s.id } })).status).toBe(403);
  });

  it("authors see every version, reviewed or not", async () => {
    const s = await scenario(author.id);
    await attach(s.id);
    await attach(s.id, model(2));
    const res = await call("GET", models.GET, { as: reviewer, params: { id: s.id } });
    expect(res.data.map((m: { version: number }) => m.version)).toEqual([2, 1]);
  });
});
