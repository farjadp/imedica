import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import * as add from "@/app/api/v1/question-bank/[id]/add/route";
import * as importRoute from "@/app/api/v1/question-bank/import/route";
import * as search from "@/app/api/v1/question-bank/route";
import { db } from "@/server/db";

import { type Person, assessment, call, organization, person, scenario } from "./helpers";

// The question bank is internal: off by default, physicians and admins only,
// imports by admins, and copies only into drafts.

const flag = vi.hoisted(() => ({ value: "on" as "on" | "off" }));
vi.mock("@/server/env", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/server/env")>();
  return { ...real, env: () => ({ ...real.env(), INTERNAL_DATASETS: flag.value }) };
});

const records = [
  {
    question: "a patient with a systolic pressure below ​ should not get nitroglycerin.",
    choices: ["a. 90 mmhg", "b. 140 mmhg", "c. 160 mmhg", "d. 180 mmhg"],
    answer: "a",
    explanation: "nitroglycerin lowers preload.",
    link: "https://quizlet.com",
    level: ["paramedic"],
    category: ["cardiology_and_resuscitation"],
  },
  {
    question: "which two are signs of shock?",
    choices: ["a. pallor", "b. bradycardia", "c. tachycardia"],
    answer: ["a", "c"],
    explanation: "",
    link: "https://quizlet.com",
    level: ["emt"],
    category: ["trauma"],
  },
  {
    question: "the normal adult respiratory rate is:",
    choices: ["a. 4-8", "b. 12-20", "c. 30-40", "d. 50-60"],
    answer: "b",
    explanation: "",
    link: "https://miningquiz.com/",
    level: ["emr", "NA"],
    category: ["assessment"],
  },
];

let admin: Person;
let physician: Person;
let lead: Person;
let medic: Person;
let publishedScenarioId: string;

beforeAll(async () => {
  const org = await organization("Lakeshore Paramedic Services");
  admin = await person("ADMIN");
  physician = await person("PHYSICIAN");
  lead = await person("INSTRUCTOR", org.id);
  medic = await person("PARAMEDIC", org.id);
  publishedScenarioId = (await scenario(physician.id, "PUBLISHED")).id;
});

afterEach(() => {
  flag.value = "on";
  vi.unstubAllGlobals();
});

function stubDownload(body: unknown, ok = true) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: ok ? 200 : 503 })));
}

describe("importing EMS-MCQA", () => {
  it("is for admins only", async () => {
    stubDownload(records);
    for (const as of [physician, lead, medic]) {
      expect((await call("POST", importRoute.POST, { as })).status).toBe(403);
    }
  });

  it("adds the single-answer questions and skips the rest", async () => {
    stubDownload(records);
    const res = await call("POST", importRoute.POST, { as: admin });
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({ added: 2, usable: 2, skipped: 1 });
    const q = await db.bankQuestion.findFirstOrThrow({ where: { levels: { has: "paramedic" } } });
    expect(q).toMatchObject({
      stem: "A patient with a systolic pressure below _____ should not get nitroglycerin.",
      options: ["90 mmhg", "140 mmhg", "160 mmhg", "180 mmhg"],
      correctIndex: 0,
      origin: "https://quizlet.com",
    });
    expect(await db.auditLog.count({ where: { action: "bank.import" } })).toBe(1);
  });

  it("is safe to run again", async () => {
    stubDownload(records);
    const res = await call("POST", importRoute.POST, { as: admin });
    expect(res.data).toMatchObject({ added: 0, usable: 2 });
    expect(await db.bankQuestion.count()).toBe(2);
  });

  it("says so when Hugging Face is down", async () => {
    stubDownload({}, false);
    expect((await call("POST", importRoute.POST, { as: admin })).status).toBe(502);
  });
});

describe("searching", () => {
  it("is for physicians and admins", async () => {
    expect((await call("GET", search.GET, { as: physician })).status).toBe(200);
    for (const as of [lead, medic]) expect((await call("GET", search.GET, { as })).status).toBe(403);
    expect((await call("GET", search.GET, {})).status).toBe(401);
  });

  it("filters by level and text", async () => {
    const byLevel = await call("GET", search.GET, { as: physician, query: { level: "paramedic" } });
    expect(byLevel.data).toMatchObject({ total: 1, all: 2 });
    const byText = await call("GET", search.GET, { as: physician, query: { q: "RESPIRATORY" } });
    expect(byText.data.items.map((i: { stem: string }) => i.stem)).toEqual(["The normal adult respiratory rate is:"]);
  });
});

describe("copying into an assessment", () => {
  it("adds the question to a draft and names the source", async () => {
    const draft = await assessment(physician.id, [publishedScenarioId]);
    const bank = await db.bankQuestion.findFirstOrThrow({ where: { levels: { has: "paramedic" } } });
    const res = await call("POST", add.POST, { as: physician, params: { id: bank.id }, body: { assessmentId: draft.id } });
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({ stem: bank.stem, correctIndex: 0, order: 5 });
    expect(res.data.reference).toMatch(/^EMS-MCQA \(internal test, licence not cleared\), from https:\/\/quizlet\.com/);
  });

  it("writes a placeholder rationale when the source has none", async () => {
    const draft = await assessment(physician.id, [publishedScenarioId]);
    const bank = await db.bankQuestion.findFirstOrThrow({ where: { levels: { has: "emr" } } });
    const res = await call("POST", add.POST, { as: physician, params: { id: bank.id }, body: { assessmentId: draft.id } });
    expect(res.data.rationale).toMatch(/Write one before sending this for review/);
  });

  it("refuses a published assessment and a learner", async () => {
    const published = await assessment(physician.id, [publishedScenarioId], "PUBLISHED");
    const bank = await db.bankQuestion.findFirstOrThrow();
    const body = { assessmentId: published.id };
    expect((await call("POST", add.POST, { as: physician, params: { id: bank.id }, body })).status).toBe(409);
    expect((await call("POST", add.POST, { as: medic, params: { id: bank.id }, body })).status).toBe(403);
  });
});

describe("with INTERNAL_DATASETS off", () => {
  it("every endpoint answers 404, even for an admin", async () => {
    flag.value = "off";
    stubDownload(records);
    const bank = await db.bankQuestion.findFirstOrThrow();
    const draft = await assessment(physician.id, [publishedScenarioId]);
    expect((await call("GET", search.GET, { as: admin })).status).toBe(404);
    expect((await call("POST", importRoute.POST, { as: admin })).status).toBe(404);
    const res = await call("POST", add.POST, { as: admin, params: { id: bank.id }, body: { assessmentId: draft.id } });
    expect(res.status).toBe(404);
  });
});
