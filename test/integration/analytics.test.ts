import { beforeAll, describe, expect, it } from "vitest";

import * as analytics from "@/app/api/v1/analytics/route";
import { db } from "@/server/db";
import { cohortKeyFor } from "@/server/privacy/deidentify";
import { K_ANONYMITY, weekStart } from "@/server/privacy/hash";

import { type Person, call, organization, person } from "./helpers";

// Team analytics: training leads see their own service, only in groups of at
// least K_ANONYMITY people, and never another service's numbers.

let lakeshoreId: string;
let harbourId: string;
let quietId: string;
let admin: Person;
let physician: Person;
let lead: Person;
let medic: Person;
let orphanLead: Person;

/** One finished, de-identified run per person, as the analytics projection writes it. */
async function runs(orgId: string, people: number, scorePct: number) {
  const week = weekStart(new Date());
  for (let i = 0; i < people; i++) {
    await db.analyticsSession.create({
      data: {
        anonymousHash: `${orgId}-person-${i}`,
        cohortKey: cohortKeyFor(orgId),
        scenarioId: "scenario",
        category: "CARDIAC",
        difficulty: "INTERMEDIATE",
        scorePct,
        durationSec: 300,
        outcome: "COMPLETED",
        completedWeek: week,
      },
    });
  }
}

beforeAll(async () => {
  lakeshoreId = (await organization("Lakeshore Paramedic Services")).id;
  harbourId = (await organization("Harbour EMS")).id;
  quietId = (await organization("Quiet Township Fire")).id;
  admin = await person("ADMIN");
  physician = await person("PHYSICIAN");
  lead = await person("INSTRUCTOR", lakeshoreId);
  medic = await person("PARAMEDIC", lakeshoreId);
  orphanLead = await person("INSTRUCTOR", null);

  await runs(lakeshoreId, K_ANONYMITY, 80);
  await runs(harbourId, K_ANONYMITY + 3, 20);
  await runs(quietId, K_ANONYMITY - 1, 50);
});

describe("who may see team analytics", () => {
  it.each([
    ["a paramedic", () => medic],
    ["a physician", () => physician],
  ])("%s can't", async (_who, who) => {
    expect((await call("GET", analytics.GET, { as: who() })).status).toBe(403);
  });

  it("a training lead without an organization can't", async () => {
    expect((await call("GET", analytics.GET, { as: orphanLead })).status).toBe(403);
  });
});

describe("a training lead is pinned to their own service", () => {
  it("with no organization given, they get their own", async () => {
    const res = await call("GET", analytics.GET, { as: lead });
    expect(res.status).toBe(200);
    expect(res.data.organizationId).toBe(lakeshoreId);
    expect(res.data.overall).toMatchObject({ suppressed: false, people: K_ANONYMITY, averageScore: 80 });
  });

  it("asking for another service is refused", async () => {
    const res = await call("GET", analytics.GET, { as: lead, query: { organizationId: harbourId } });
    expect(res.status).toBe(403);
  });

  it("another service's runs never leak into their numbers", async () => {
    const res = await call("GET", analytics.GET, { as: lead });
    expect(res.data.overall.runs).toBe(K_ANONYMITY);
  });
});

describe("Imedica admins", () => {
  it("must choose an organization", async () => {
    expect((await call("GET", analytics.GET, { as: admin })).status).toBe(400);
  });

  it("can see any one organization", async () => {
    const res = await call("GET", analytics.GET, { as: admin, query: { organizationId: harbourId } });
    expect(res.status).toBe(200);
    expect(res.data.overall).toMatchObject({ suppressed: false, people: K_ANONYMITY + 3, averageScore: 20 });
  });
});

describe("k-anonymity", () => {
  it(`fewer than ${K_ANONYMITY} people means no figures at all`, async () => {
    const res = await call("GET", analytics.GET, { as: admin, query: { organizationId: quietId } });
    expect(res.status).toBe(200);
    expect(res.data.overall).toEqual({ suppressed: true, people: K_ANONYMITY - 1 });
    for (const row of [...res.data.byCategory, ...res.data.weekly]) {
      expect(row.suppressed).toBe(true);
      expect(row.averageScore).toBeUndefined();
    }
  });
});
