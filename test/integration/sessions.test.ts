import { beforeAll, describe, expect, it } from "vitest";

import * as decisions from "@/app/api/v1/sessions/[id]/decisions/route";
import * as end from "@/app/api/v1/sessions/[id]/end/route";
import * as explanation from "@/app/api/v1/sessions/[id]/explanation/route";
import * as review from "@/app/api/v1/sessions/[id]/review/route";
import * as runtime from "@/app/api/v1/sessions/[id]/route";
import * as sessions from "@/app/api/v1/sessions/route";
import { db } from "@/server/db";

import { type Person, call, organization, person, scenario } from "./helpers";

// A run belongs to the person who started it, and to nobody else: not a
// colleague, not their training lead, not an Imedica admin.

let owner: Person;
let colleague: Person;
let instructor: Person;
let outsider: Person;
let admin: Person;
let published: Awaited<ReturnType<typeof scenario>>;

beforeAll(async () => {
  const lakeshore = await organization("Lakeshore Paramedic Services");
  const harbour = await organization("Harbour EMS");
  const physician = await person("PHYSICIAN");
  owner = await person("PARAMEDIC", lakeshore.id);
  colleague = await person("PARAMEDIC", lakeshore.id);
  instructor = await person("INSTRUCTOR", lakeshore.id);
  outsider = await person("PARAMEDIC", harbour.id);
  admin = await person("ADMIN");
  published = await scenario(physician.id, "PUBLISHED");
});

async function startRun(as: Person) {
  const res = await call("POST", sessions.POST, { as, body: { scenarioId: published.id } });
  expect(res.status).toBe(201);
  return res.data.id as string;
}

describe("starting a run", () => {
  it("only published scenarios can be run", async () => {
    const physician = await person("PHYSICIAN");
    const draft = await scenario(physician.id, "DRAFT");
    const inReview = await scenario(physician.id, "IN_REVIEW");
    for (const s of [draft, inReview]) {
      const res = await call("POST", sessions.POST, { as: owner, body: { scenarioId: s.id } });
      expect(res.status).toBe(404);
    }
  });

  it("the run is keyed by an anonymous hash and the person's cohort, never their id", async () => {
    const id = await startRun(owner);
    const row = await db.trainingSession.findUniqueOrThrow({ where: { id } });
    expect(JSON.stringify(row)).not.toContain(owner.id);
    expect(row.cohortKey).toBeTruthy();
    expect(row.cohortKey).not.toBe(owner.organizationId);
  });
});

describe("someone else's run looks exactly like a missing one", () => {
  let runId: string;

  beforeAll(async () => {
    runId = await startRun(owner);
  });

  it.each([
    ["a colleague", () => colleague],
    ["their training lead", () => instructor],
    ["someone at another service", () => outsider],
    ["an Imedica admin", () => admin],
  ])("%s gets 404 on every run endpoint", async (_who, who) => {
    const as = who();
    const params = { id: runId };
    const results = [
      await call("GET", runtime.GET, { as, params }),
      await call("POST", decisions.POST, { as, params, body: { actionId: published.actions.ecg.id } }),
      await call("GET", explanation.GET, { as, params }),
      await call("GET", review.GET, { as, params }),
      await call("POST", end.POST, { as, params }),
    ];
    for (const res of results) {
      expect(res.status).toBe(404);
      expect(res.error.message).toBe("Run not found.");
    }
  });

  it("nobody else's attempt changed the run", async () => {
    const row = await db.trainingSession.findUniqueOrThrow({ where: { id: runId } });
    expect(row.status).toBe("IN_PROGRESS");
    expect(await db.sessionDecision.count({ where: { sessionId: runId } })).toBe(0);
  });

  it("it doesn't show up in anyone else's history", async () => {
    const res = await call("GET", sessions.GET, { as: colleague });
    expect(res.data.map((s: { id: string }) => s.id)).not.toContain(runId);
  });

  it("the owner can play it through to the debrief", async () => {
    const params = { id: runId };
    const live = await call("GET", runtime.GET, { as: owner, params });
    expect(live.status).toBe(200);
    // The runtime never carries the scoring rules.
    expect(JSON.stringify(live.data)).not.toContain("rationale");

    const verdict = await call("POST", decisions.POST, { as: owner, params, body: { actionId: published.actions.transport.id } });
    expect(verdict.status).toBe(201);
    expect(verdict.data).toMatchObject({ outcome: "CORRECT", ended: true });

    const debrief = await call("GET", review.GET, { as: owner, params });
    expect(debrief.status).toBe(200);
    expect(debrief.data.percent).toBe(100);

    const mine = await call("GET", sessions.GET, { as: owner });
    expect(mine.data.map((s: { id: string }) => s.id)).toContain(runId);
  });

  it("a decision can't use an action from another scenario", async () => {
    const physician = await person("PHYSICIAN");
    const other = await scenario(physician.id, "PUBLISHED");
    const id = await startRun(owner);
    const res = await call("POST", decisions.POST, { as: owner, params: { id }, body: { actionId: other.actions.ecg.id } });
    expect(res.status).toBe(422);
  });
});
