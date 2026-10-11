import { beforeAll, describe, expect, it } from "vitest";

import * as report from "@/app/api/v1/assessments/[id]/report/route";
import { db } from "@/server/db";
import { cohortKeyFor } from "@/server/privacy/deidentify";
import { K_ANONYMITY } from "@/server/privacy/hash";

import { type Person, assessment, call, organization, person, scenario } from "./helpers";

// The pilot report: paired people only, k-anonymous, one service at a time.

let lakeshoreId: string;
let harbourId: string;
let admin: Person;
let lead: Person;
let medic: Person;
let physician: Person;
let a: Awaited<ReturnType<typeof assessment>>;
let s1: string;
let s2: string;

/** One person's finished attempt: a quiz score and a score on each scenario (out of 10). */
async function finished(orgId: string, who: string, phase: "PRE" | "POST", quiz: number, scores: [number, number]) {
  const attempt = await db.assessmentAttempt.create({
    data: {
      assessmentId: a.id,
      windowId: `${orgId}-${phase}`,
      phase,
      anonymousHash: who,
      cohortKey: cohortKeyFor(orgId),
      quizScorePct: quiz,
      completedAt: new Date(),
    },
  });
  for (const [i, scenarioId] of [s1, s2].entries()) {
    await db.trainingSession.create({
      data: {
        scenarioId,
        anonymousHash: who,
        attemptId: attempt.id,
        status: "COMPLETED",
        score: scores[i],
        maxScore: 10,
        endedAt: new Date(),
      },
    });
  }
}

beforeAll(async () => {
  lakeshoreId = (await organization("Lakeshore Paramedic Services")).id;
  harbourId = (await organization("Harbour EMS")).id;
  admin = await person("ADMIN");
  physician = await person("PHYSICIAN");
  lead = await person("INSTRUCTOR", lakeshoreId);
  medic = await person("PARAMEDIC", lakeshoreId);
  s1 = (await scenario(physician.id, "PUBLISHED")).id;
  s2 = (await scenario(physician.id, "PUBLISHED")).id;
  a = await assessment(physician.id, [s1, s2], "PUBLISHED");

  // Lakeshore: K people do both rounds (60% → 80% on scenarios, 50% → 70% on the quiz),
  // and one more person only does the pre-test.
  for (let i = 0; i < K_ANONYMITY; i++) {
    await finished(lakeshoreId, `lake-${i}`, "PRE", 50, [6, 6]);
    await finished(lakeshoreId, `lake-${i}`, "POST", 70, [8, 8]);
  }
  await finished(lakeshoreId, "lake-extra", "PRE", 0, [0, 0]);

  // Harbour: only K - 1 people paired, with very different numbers.
  for (let i = 0; i < K_ANONYMITY - 1; i++) {
    await finished(harbourId, `harbour-${i}`, "PRE", 90, [10, 10]);
    await finished(harbourId, `harbour-${i}`, "POST", 10, [1, 1]);
  }
});

describe("who may see the report", () => {
  it.each([
    ["a paramedic", () => medic],
    ["a physician", () => physician],
  ])("%s can't", async (_who, who) => {
    expect((await call("GET", report.GET, { as: who(), params: { id: a.id } })).status).toBe(403);
  });

  it("a training lead can't ask for another service", async () => {
    const res = await call("GET", report.GET, { as: lead, params: { id: a.id }, query: { organizationId: harbourId } });
    expect(res.status).toBe(403);
  });
});

describe("the numbers", () => {
  it("compare only the people who did both rounds, in the lead's own service", async () => {
    const res = await call("GET", report.GET, { as: lead, params: { id: a.id } });
    expect(res.status).toBe(200);
    expect(res.data.scenarios).toMatchObject({
      suppressed: false,
      people: K_ANONYMITY,
      preAvg: 60,
      postAvg: 80,
      delta: 20,
      relativePct: 33,
    });
    expect(res.data.quiz).toMatchObject({ suppressed: false, preAvg: 50, postAvg: 70, delta: 20, relativePct: 40 });
    expect(res.data.metTarget).toBe(true);
    expect(res.data.finished).toEqual({
      pre: { count: K_ANONYMITY + 1, suppressed: false },
      post: { count: K_ANONYMITY, suppressed: false },
    });
    expect(res.data.byScenario).toHaveLength(2);
    expect(res.data.byScenario[0]).toMatchObject({ suppressed: false, preAvg: 60, postAvg: 80 });
  });

  it(`are withheld entirely below ${K_ANONYMITY} paired people`, async () => {
    const res = await call("GET", report.GET, { as: admin, params: { id: a.id }, query: { organizationId: harbourId } });
    expect(res.status).toBe(200);
    expect(res.data.scenarios).toEqual({ suppressed: true, people: K_ANONYMITY - 1 });
    expect(res.data.quiz).toEqual({ suppressed: true, people: K_ANONYMITY - 1 });
    expect(res.data.metTarget).toBeNull();
    expect(res.data.finished.pre).toEqual({ count: null, suppressed: true });
    for (const row of res.data.byScenario) expect(row.suppressed).toBe(true);
  });

  it("never include an anonymous hash", async () => {
    const res = await call("GET", report.GET, { as: lead, params: { id: a.id } });
    expect(JSON.stringify(res.data)).not.toMatch(/lake-|harbour-/);
  });

  it("an admin must choose a service", async () => {
    expect((await call("GET", report.GET, { as: admin, params: { id: a.id } })).status).toBe(400);
  });
});
