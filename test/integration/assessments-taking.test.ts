import { beforeAll, describe, expect, it } from "vitest";

import * as windows from "@/app/api/v1/assessment-windows/route";
import * as answers from "@/app/api/v1/attempts/[id]/answers/route";
import * as finish from "@/app/api/v1/attempts/[id]/finish/route";
import * as attempt from "@/app/api/v1/attempts/[id]/route";
import * as runs from "@/app/api/v1/attempts/[id]/runs/route";
import * as attempts from "@/app/api/v1/attempts/route";
import * as decisions from "@/app/api/v1/sessions/[id]/decisions/route";
import * as explanation from "@/app/api/v1/sessions/[id]/explanation/route";
import * as review from "@/app/api/v1/sessions/[id]/review/route";
import * as runtime from "@/app/api/v1/sessions/[id]/route";
import * as sessions from "@/app/api/v1/sessions/route";
import { db } from "@/server/db";

import { type Person, assessment, call, organization, person, scenario } from "./helpers";

// A paramedic takes the pre-test and the post-test. Answers and debriefs stay
// hidden until the post-test is done, and nobody else can touch the attempt.

let lead: Person;
let medic: Person;
let colleague: Person;
let outsider: Person;
let s1: Awaited<ReturnType<typeof scenario>>;
let s2: Awaited<ReturnType<typeof scenario>>;
let a: Awaited<ReturnType<typeof assessment>>;

beforeAll(async () => {
  const lakeshore = await organization("Lakeshore Paramedic Services");
  const harbour = await organization("Harbour EMS");
  const physician = await person("PHYSICIAN");
  lead = await person("INSTRUCTOR", lakeshore.id);
  medic = await person("PARAMEDIC", lakeshore.id);
  colleague = await person("PARAMEDIC", lakeshore.id);
  outsider = await person("PARAMEDIC", harbour.id);
  s1 = await scenario(physician.id, "PUBLISHED");
  s2 = await scenario(physician.id, "PUBLISHED");
  a = await assessment(physician.id, [s1.id, s2.id], "PUBLISHED");
});

async function open(phase: "PRE" | "POST") {
  const res = await call("POST", windows.POST, { as: lead, body: { assessmentId: a.id, phase } });
  expect(res.status).toBe(201);
  return res.data.id as string;
}

async function start(as: Person, windowId: string) {
  const res = await call("POST", attempts.POST, { as, body: { windowId } });
  expect(res.status).toBe(201);
  return res.data.id as string;
}

/** Answers every question (first option is right) and plays each scenario to its end. */
async function complete(as: Person, attemptId: string) {
  for (const q of a.questions) {
    expect(
      (await call("POST", answers.POST, { as, params: { id: attemptId }, body: { questionId: q.id, choice: 0 } })).status,
    ).toBe(201);
  }
  for (const s of [s1, s2]) {
    const run = await call("POST", runs.POST, { as, params: { id: attemptId }, body: { scenarioId: s.id } });
    expect(run.status).toBe(201);
    const verdict = await call("POST", decisions.POST, {
      as,
      params: { id: run.data.id },
      body: { actionId: s.actions.transport.id },
    });
    expect(verdict.data.ended).toBe(true);
  }
  return call("POST", finish.POST, { as, params: { id: attemptId } });
}

describe("the full journey", () => {
  let preWindow: string;
  let preAttempt: string;
  let preRunId: string;

  it("a paramedic sees the pre-test open for their service; someone elsewhere doesn't", async () => {
    preWindow = await open("PRE");
    const mine = await call("GET", attempts.GET, { as: medic });
    expect(mine.data).toHaveLength(1);
    expect(mine.data[0]).toMatchObject({ windowId: preWindow, phase: "PRE", attemptId: null });
    expect((await call("GET", attempts.GET, { as: outsider })).data).toEqual([]);
    expect((await call("POST", attempts.POST, { as: outsider, body: { windowId: preWindow } })).status).toBe(404);
  });

  it("starting twice resumes the same attempt, keyed by anonymous hash", async () => {
    preAttempt = await start(medic, preWindow);
    expect(await start(medic, preWindow)).toBe(preAttempt);
    const row = await db.assessmentAttempt.findUniqueOrThrow({ where: { id: preAttempt } });
    expect(JSON.stringify(row)).not.toContain(medic.id);
  });

  it("the quiz comes without answers or rationales", async () => {
    const res = await call("GET", attempt.GET, { as: medic, params: { id: preAttempt } });
    expect(res.status).toBe(200);
    expect(res.data.quiz).toHaveLength(5);
    expect(JSON.stringify(res.data.quiz)).not.toMatch(/correctIndex|rationale/);
    expect(res.data.reveal).toBe(false);
  });

  it("can't finish with questions or scenarios left", async () => {
    const res = await call("POST", finish.POST, { as: medic, params: { id: preAttempt } });
    expect(res.status).toBe(409);
  });

  it("a scenario outside the assessment can't be run as part of it", async () => {
    const physician = await person("PHYSICIAN");
    const other = await scenario(physician.id, "PUBLISHED");
    const res = await call("POST", runs.POST, { as: medic, params: { id: preAttempt }, body: { scenarioId: other.id } });
    expect(res.status).toBe(422);
  });

  it("the pre-test completes once everything is done", async () => {
    const res = await complete(medic, preAttempt);
    expect(res.status).toBe(201);
    const row = await db.assessmentAttempt.findUniqueOrThrow({ where: { id: preAttempt } });
    expect(row.quizScorePct).toBe(100);
    preRunId = (await db.trainingSession.findFirstOrThrow({ where: { attemptId: preAttempt } })).id;
  });

  it("each scenario runs once per attempt", async () => {
    // The attempt is finished, so it's refused either way; a fresh one checks the run rule.
    const res = await call("POST", runs.POST, { as: medic, params: { id: preAttempt }, body: { scenarioId: s1.id } });
    expect(res.status).toBe(409);
  });

  it("pre-test runs have no debrief, no AI note, and stay out of practice history", async () => {
    const debrief = await call("GET", review.GET, { as: medic, params: { id: preRunId } });
    expect(debrief.status).toBe(403);
    expect((await call("GET", explanation.GET, { as: medic, params: { id: preRunId } })).status).toBe(403);
    expect(await db.aiFeedback.count({ where: { sessionId: preRunId } })).toBe(0);
    const history = await call("GET", sessions.GET, { as: medic });
    expect(history.data.map((r: { id: string }) => r.id)).not.toContain(preRunId);
  });

  it("practising the same scenario doesn't void an assessment run", async () => {
    const postWindow = await open("POST");
    const postAttempt = await start(medic, postWindow);
    const run = await call("POST", runs.POST, { as: medic, params: { id: postAttempt }, body: { scenarioId: s1.id } });
    await call("POST", sessions.POST, { as: medic, body: { scenarioId: s1.id } });
    expect((await db.trainingSession.findUniqueOrThrow({ where: { id: run.data.id } })).status).toBe("IN_PROGRESS");
  });

  it("after the post-test, answers, scores and every debrief open up", async () => {
    const postAttempt = (await call("GET", attempts.GET, { as: medic })).data.find(
      (x: { phase: string }) => x.phase === "POST",
    ).attemptId;
    expect((await complete(medic, postAttempt)).status).toBe(201);

    const res = await call("GET", attempt.GET, { as: medic, params: { id: preAttempt } });
    expect(res.data.reveal).toBe(true);
    expect(res.data.quiz[0]).toMatchObject({ correctIndex: 0, rationale: expect.any(String) });
    expect(res.data.quizScorePct).toBe(100);
    expect((await call("GET", review.GET, { as: medic, params: { id: preRunId } })).status).toBe(200);
  });
});

describe("assessment runs give nothing away while they're played", () => {
  it("decisions come back without a verdict, here and in the runtime", async () => {
    const windowId = (await call("GET", attempts.GET, { as: colleague })).data.find((x: { phase: string }) => x.phase === "POST").windowId;
    const attemptId = await start(colleague, windowId);
    const run = await call("POST", runs.POST, { as: colleague, params: { id: attemptId }, body: { scenarioId: s2.id } });
    const verdict = await call("POST", decisions.POST, {
      as: colleague,
      params: { id: run.data.id },
      body: { actionId: s2.actions.asa.id },
    });
    expect(verdict.status).toBe(201);
    expect(verdict.data).toMatchObject({ outcome: null, late: false, repeated: false, ended: false });

    const live = await call("GET", runtime.GET, { as: colleague, params: { id: run.data.id } });
    expect(live.data.assessment).toBe(true);
    expect(live.data.decisions).toHaveLength(1);
    expect(live.data.decisions[0].outcome).toBeNull();
    // Still scored, so the paired report works.
    const row = await db.sessionDecision.findFirstOrThrow({ where: { sessionId: run.data.id } });
    expect(row.outcome).not.toBeNull();
  });

  it("a practice run still gets its verdict", async () => {
    const practice = await call("POST", sessions.POST, { as: colleague, body: { scenarioId: s2.id } });
    const verdict = await call("POST", decisions.POST, {
      as: colleague,
      params: { id: practice.data.id },
      body: { actionId: s2.actions.asa.id },
    });
    expect(verdict.data.outcome).not.toBeNull();
    const live = await call("GET", runtime.GET, { as: colleague, params: { id: practice.data.id } });
    expect(live.data.assessment).toBe(false);
    expect(live.data.decisions[0].outcome).not.toBeNull();
  });
});

describe("nobody else can touch an attempt", () => {
  it.each([
    ["a colleague", () => colleague],
    ["their training lead", () => lead],
    ["someone at another service", () => outsider],
  ])("%s gets 404 on every attempt endpoint", async (_who, who) => {
    const [mine] = (await call("GET", attempts.GET, { as: medic })).data;
    const id = mine.attemptId;
    const as = who();
    for (const res of [
      await call("GET", attempt.GET, { as, params: { id } }),
      await call("POST", answers.POST, { as, params: { id }, body: { questionId: a.questions[0].id, choice: 1 } }),
      await call("POST", runs.POST, { as, params: { id }, body: { scenarioId: s1.id } }),
      await call("POST", finish.POST, { as, params: { id } }),
    ]) {
      expect(res.status).toBe(404);
    }
  });
});

describe("closed windows", () => {
  it("refuse new attempts and answers", async () => {
    const physician = await person("PHYSICIAN");
    const s = await scenario(physician.id, "PUBLISHED");
    const other = await assessment(physician.id, [s.id], "PUBLISHED");
    const w = await call("POST", windows.POST, { as: lead, body: { assessmentId: other.id, phase: "PRE" } });
    const id = await start(medic, w.data.id);
    await db.assessmentWindow.update({ where: { id: w.data.id }, data: { closesAt: new Date(Date.now() - 1000) } });

    expect((await call("POST", attempts.POST, { as: colleague, body: { windowId: w.data.id } })).status).toBe(409);
    const res = await call("POST", answers.POST, {
      as: medic,
      params: { id },
      body: { questionId: other.questions[0].id, choice: 0 },
    });
    expect(res.status).toBe(409);
  });

  it("refuse an answer outside the options or from another assessment", async () => {
    const physician = await person("PHYSICIAN");
    const s = await scenario(physician.id, "PUBLISHED");
    const one = await assessment(physician.id, [s.id], "PUBLISHED");
    const two = await assessment(physician.id, [s.id], "PUBLISHED");
    const w = await call("POST", windows.POST, { as: lead, body: { assessmentId: one.id, phase: "PRE" } });
    const id = await start(colleague, w.data.id);
    const outOfRange = await call("POST", answers.POST, {
      as: colleague,
      params: { id },
      body: { questionId: one.questions[0].id, choice: 9 },
    });
    expect(outOfRange.status).toBe(422);
    const foreign = await call("POST", answers.POST, {
      as: colleague,
      params: { id },
      body: { questionId: two.questions[0].id, choice: 0 },
    });
    expect(foreign.status).toBe(422);
  });
});
