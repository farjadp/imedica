import { beforeAll, describe, expect, it } from "vitest";

import * as questionOrder from "@/app/api/v1/assessments/[id]/questions/order/route";
import * as question from "@/app/api/v1/assessments/[id]/questions/[questionId]/route";
import * as questions from "@/app/api/v1/assessments/[id]/questions/route";
import * as one from "@/app/api/v1/assessments/[id]/route";
import * as status from "@/app/api/v1/assessments/[id]/status/route";
import * as list from "@/app/api/v1/assessments/route";
import { db } from "@/server/db";

import { type Person, assessment, call, organization, person, scenario } from "./helpers";

// Who may write assessments, who may read what, and the two-person rule.

let admin: Person;
let author: Person;
let reviewer: Person;
let lead: Person;
let medic: Person;
let publishedScenarioId: string;
let draftScenarioId: string;

beforeAll(async () => {
  const org = await organization("Lakeshore Paramedic Services");
  admin = await person("ADMIN");
  author = await person("PHYSICIAN");
  reviewer = await person("PHYSICIAN");
  lead = await person("INSTRUCTOR", org.id);
  medic = await person("PARAMEDIC", org.id);
  publishedScenarioId = (await scenario(author.id, "PUBLISHED")).id;
  draftScenarioId = (await scenario(author.id, "DRAFT")).id;
});

const basics = () => ({
  title: "Lakeshore pilot baseline",
  summary: "Cardiac calls and a short directive quiz.",
  scenarioIds: [publishedScenarioId],
});
const newQuestion = {
  stem: "Which finding rules out nitroglycerin?",
  options: ["SBP below 100", "Heart rate 90", "SpO2 96%"],
  correctIndex: 0,
  rationale: "Nitro drops preload; a soft pressure gets softer.",
};

describe("writing assessments is for physicians and admins", () => {
  it.each(["medic", "lead"] as const)("a %s can't create one", async (who) => {
    const as = who === "medic" ? medic : lead;
    expect((await call("POST", list.POST, { as, body: basics() })).status).toBe(403);
  });

  it("a physician can, and is recorded as the author", async () => {
    const res = await call("POST", list.POST, { as: author, body: basics() });
    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({ authorId: author.id, status: "DRAFT" });
  });

  it("only published scenarios can be included", async () => {
    const res = await call("POST", list.POST, { as: author, body: { ...basics(), scenarioIds: [draftScenarioId] } });
    expect(res.status).toBe(422);
  });

  it("a learner or training lead can't change a draft or its questions", async () => {
    const a = await assessment(author.id, [publishedScenarioId]);
    const params = { id: a.id };
    const q = { id: a.id, questionId: a.questions[0].id };
    for (const as of [medic, lead]) {
      expect((await call("PATCH", one.PATCH, { as, params, body: { title: "Mine" } })).status).toBe(403);
      expect((await call("DELETE", one.DELETE, { as, params })).status).toBe(403);
      expect((await call("POST", questions.POST, { as, params, body: newQuestion })).status).toBe(403);
      expect((await call("PATCH", question.PATCH, { as, params: q, body: { correctIndex: 2 } })).status).toBe(403);
      expect((await call("DELETE", question.DELETE, { as, params: q })).status).toBe(403);
      expect((await call("PUT", questionOrder.PUT, { as, params, body: { ids: [a.questions[0].id] } })).status).toBe(403);
      expect((await call("POST", status.POST, { as, params, body: { action: "submit" } })).status).toBe(403);
    }
    const after = await db.assessmentQuestion.findUniqueOrThrow({ where: { id: a.questions[0].id } });
    expect(after.correctIndex).toBe(0);
  });
});

describe("reading", () => {
  it("a paramedic can't list or read assessments at all", async () => {
    const a = await assessment(author.id, [publishedScenarioId], "PUBLISHED");
    expect((await call("GET", list.GET, { as: medic })).status).toBe(403);
    expect((await call("GET", one.GET, { as: medic, params: { id: a.id } })).status).toBe(404);
  });

  it("a training lead sees published assessments only, without the answers", async () => {
    const draft = await assessment(author.id, [publishedScenarioId], "DRAFT");
    const published = await assessment(author.id, [publishedScenarioId], "PUBLISHED");

    const res = await call("GET", list.GET, { as: lead });
    const ids = res.data.map((a: { id: string }) => a.id);
    expect(ids).toContain(published.id);
    expect(ids).not.toContain(draft.id);

    expect((await call("GET", one.GET, { as: lead, params: { id: draft.id } })).status).toBe(404);
    const detail = await call("GET", one.GET, { as: lead, params: { id: published.id } });
    expect(detail.status).toBe(200);
    expect(detail.data.questions).toBeUndefined();
    expect(detail.data.questionCount).toBe(5);
    expect(JSON.stringify(detail.data)).not.toContain("correctIndex");
  });

  it("an author sees the questions, answers and what's left to do", async () => {
    const a = await assessment(author.id, [publishedScenarioId]);
    const res = await call("GET", one.GET, { as: reviewer, params: { id: a.id } });
    expect(res.data.questions).toHaveLength(5);
    expect(res.data.questions[0].correctIndex).toBe(0);
    expect(res.data.problems).toEqual([]);
  });
});

describe("the two-person publish rule", () => {
  it("the author submits, can't publish, and a second physician can", async () => {
    const a = await assessment(author.id, [publishedScenarioId]);
    const params = { id: a.id };

    expect((await call("POST", status.POST, { as: author, params, body: { action: "submit" } })).data.status).toBe("IN_REVIEW");
    expect((await call("POST", status.POST, { as: author, params, body: { action: "publish" } })).status).toBe(403);

    const published = await call("POST", status.POST, { as: reviewer, params, body: { action: "publish" } });
    expect(published.status).toBe(201);
    expect(published.data).toMatchObject({ status: "PUBLISHED", reviewerId: reviewer.id });
  });

  it("an admin may publish their own", async () => {
    const a = await assessment(admin.id, [publishedScenarioId], "IN_REVIEW");
    expect((await call("POST", status.POST, { as: admin, params: { id: a.id }, body: { action: "publish" } })).status).toBe(201);
  });

  it("an incomplete assessment can't go to review", async () => {
    const a = await assessment(author.id, []);
    const res = await call("POST", status.POST, { as: author, params: { id: a.id }, body: { action: "submit" } });
    expect(res.status).toBe(422);
  });

  it.each(["IN_REVIEW", "PUBLISHED"] as const)("an assessment %s is locked", async (s) => {
    const a = await assessment(author.id, [publishedScenarioId], s);
    const params = { id: a.id };
    expect((await call("PATCH", one.PATCH, { as: reviewer, params, body: { title: "Quiet change" } })).status).toBe(409);
    expect((await call("POST", questions.POST, { as: reviewer, params, body: newQuestion })).status).toBe(409);
    expect(
      (
        await call("PATCH", question.PATCH, {
          as: reviewer,
          params: { id: a.id, questionId: a.questions[0].id },
          body: { correctIndex: 1 },
        })
      ).status,
    ).toBe(409);
  });
});

describe("questions", () => {
  it("an author adds, edits, reorders and removes questions", async () => {
    const a = await assessment(author.id, [publishedScenarioId]);
    const params = { id: a.id };

    const added = await call("POST", questions.POST, { as: author, params, body: newQuestion });
    expect(added.status).toBe(201);
    expect(added.data.order).toBe(5);

    const q = { id: a.id, questionId: added.data.id };
    expect((await call("PATCH", question.PATCH, { as: author, params: q, body: { correctIndex: 2 } })).data.correctIndex).toBe(2);

    const reordered = [added.data.id, ...a.questions.map((x) => x.id)];
    expect((await call("PUT", questionOrder.PUT, { as: author, params, body: { ids: reordered } })).status).toBe(200);
    expect((await db.assessmentQuestion.findUniqueOrThrow({ where: { id: added.data.id } })).order).toBe(0);

    expect((await call("DELETE", question.DELETE, { as: author, params: q })).status).toBe(200);
  });

  it("a correct answer outside the options is refused, also after an edit", async () => {
    const a = await assessment(author.id, [publishedScenarioId]);
    const params = { id: a.id };
    expect((await call("POST", questions.POST, { as: author, params, body: { ...newQuestion, correctIndex: 3 } })).status).toBe(
      422,
    );
    const shrink = await call("PATCH", question.PATCH, {
      as: author,
      params: { id: a.id, questionId: a.questions[0].id },
      body: { options: ["Only one", "Two"], correctIndex: 4 },
    });
    expect(shrink.status).toBe(422);
  });

  it("another assessment's question can't be reached through this one", async () => {
    const mine = await assessment(author.id, [publishedScenarioId]);
    const theirs = await assessment(reviewer.id, [publishedScenarioId]);
    const params = { id: mine.id, questionId: theirs.questions[0].id };
    expect((await call("PATCH", question.PATCH, { as: author, params, body: { stem: "Hijacked question?" } })).status).toBe(404);
    expect((await call("DELETE", question.DELETE, { as: author, params })).status).toBe(404);
    const order = await call("PUT", questionOrder.PUT, {
      as: author,
      params: { id: mine.id },
      body: { ids: [mine.questions[0].id, theirs.questions[0].id] },
    });
    expect(order.status).toBe(422);
  });
});

describe("deleting", () => {
  it("a draft nobody has taken can be deleted", async () => {
    const a = await assessment(author.id, [publishedScenarioId]);
    expect((await call("DELETE", one.DELETE, { as: author, params: { id: a.id } })).status).toBe(200);
  });

  it("a draft with attempts can't be deleted", async () => {
    const a = await assessment(author.id, [publishedScenarioId]);
    await db.assessmentAttempt.create({
      data: { assessmentId: a.id, windowId: "w", phase: "PRE", anonymousHash: "h" },
    });
    expect((await call("DELETE", one.DELETE, { as: author, params: { id: a.id } })).status).toBe(409);
  });
});
