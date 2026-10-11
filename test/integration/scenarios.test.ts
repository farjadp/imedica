import { beforeAll, describe, expect, it } from "vitest";

import * as child from "@/app/api/v1/scenarios/[id]/[collection]/[itemId]/route";
import * as order from "@/app/api/v1/scenarios/[id]/[collection]/order/route";
import * as collection from "@/app/api/v1/scenarios/[id]/[collection]/route";
import * as one from "@/app/api/v1/scenarios/[id]/route";
import * as status from "@/app/api/v1/scenarios/[id]/status/route";
import * as list from "@/app/api/v1/scenarios/route";
import { db } from "@/server/db";

import { type Person, call, organization, person, scenario } from "./helpers";

// Who may author, who may read what, and the two-person publish rule.

let admin: Person;
let author: Person;
let reviewer: Person;
let instructor: Person;
let medic: Person;

beforeAll(async () => {
  const org = await organization("Lakeshore Paramedic Services");
  admin = await person("ADMIN");
  author = await person("PHYSICIAN");
  reviewer = await person("PHYSICIAN");
  instructor = await person("INSTRUCTOR", org.id);
  medic = await person("PARAMEDIC", org.id);
});

const basics = {
  title: "Anaphylaxis at a wedding",
  summary: "A guest collapses after the dessert course.",
  dispatch: "Priority 4. Adult female, difficulty breathing.",
  category: "ALLERGIC",
  difficulty: "INTERMEDIATE",
  timeLimitSec: 600,
  learningGoals: [],
};

describe("authoring is for physicians and admins", () => {
  it.each(["medic", "instructor"] as const)("a %s can't create a scenario", async (who) => {
    const as = who === "medic" ? medic : instructor;
    expect((await call("POST", list.POST, { as, body: basics })).status).toBe(403);
  });

  it("a physician can, and is recorded as the author", async () => {
    const res = await call("POST", list.POST, { as: author, body: basics });
    expect(res.status).toBe(201);
    expect(res.data.authorId).toBe(author.id);
    expect(res.data.status).toBe("DRAFT");
  });

  it("a learner can't change, delete or add to a draft", async () => {
    const s = await scenario(author.id);
    const params = { id: s.id };
    expect((await call("PATCH", one.PATCH, { as: medic, params, body: { title: "Mine now" } })).status).toBe(403);
    expect((await call("DELETE", one.DELETE, { as: medic, params })).status).toBe(403);
    expect(
      (await call("POST", collection.POST, { as: medic, params: { id: s.id, collection: "actions" }, body: {} })).status,
    ).toBe(403);
    expect(
      (
        await call("PATCH", child.PATCH, {
          as: instructor,
          params: { id: s.id, collection: "actions", itemId: s.actions.ecg.id },
          body: { label: "Changed" },
        })
      ).status,
    ).toBe(403);
    expect(
      (await call("DELETE", child.DELETE, { as: medic, params: { id: s.id, collection: "actions", itemId: s.actions.ecg.id } }))
        .status,
    ).toBe(403);
    expect(
      (await call("PUT", order.PUT, { as: medic, params: { id: s.id, collection: "actions" }, body: { ids: [] } })).status,
    ).toBe(403);
    expect((await call("POST", status.POST, { as: medic, params, body: { action: "submit" } })).status).toBe(403);

    const after = await db.scenario.findUniqueOrThrow({ where: { id: s.id } });
    expect(after.title).toBe(s.title);
    expect(after.status).toBe("DRAFT");
  });
});

describe("learners only see published work, and never its answers", () => {
  it("the list holds published scenarios only", async () => {
    const draft = await scenario(author.id, "DRAFT");
    const inReview = await scenario(author.id, "IN_REVIEW");
    const published = await scenario(author.id, "PUBLISHED");

    const res = await call("GET", list.GET, { as: medic, query: { status: "DRAFT" } });
    const ids = res.data.map((s: { id: string }) => s.id);
    expect(ids).toContain(published.id);
    expect(ids).not.toContain(draft.id);
    expect(ids).not.toContain(inReview.id);
  });

  it("an unpublished scenario looks missing", async () => {
    const draft = await scenario(author.id, "DRAFT");
    expect((await call("GET", one.GET, { as: medic, params: { id: draft.id } })).status).toBe(404);
    expect(
      (await call("GET", collection.GET, { as: medic, params: { id: draft.id, collection: "states" } })).status,
    ).toBe(404);
  });

  it("a published scenario comes without rules or teaching notes", async () => {
    const published = await scenario(author.id, "PUBLISHED");
    const res = await call("GET", one.GET, { as: medic, params: { id: published.id } });
    expect(res.status).toBe(200);
    expect(res.data.rules).toEqual([]);
    expect(res.data.feedback).toEqual([]);
    expect(res.data.problems).toBeUndefined();

    const rules = await call("GET", collection.GET, { as: medic, params: { id: published.id, collection: "rules" } });
    expect(rules.data).toEqual([]);
  });

  it("an author sees the rules", async () => {
    const published = await scenario(author.id, "PUBLISHED");
    const res = await call("GET", one.GET, { as: reviewer, params: { id: published.id } });
    expect(res.data.rules).toHaveLength(1);
  });
});

describe("the two-person publish rule", () => {
  it("the author submits, can't publish their own work, and a second physician can", async () => {
    const s = await scenario(author.id);
    const params = { id: s.id };

    const submitted = await call("POST", status.POST, { as: author, params, body: { action: "submit" } });
    expect(submitted.status).toBe(201);
    expect(submitted.data.status).toBe("IN_REVIEW");

    const selfPublish = await call("POST", status.POST, { as: author, params, body: { action: "publish" } });
    expect(selfPublish.status).toBe(403);
    expect((await db.scenario.findUniqueOrThrow({ where: { id: s.id } })).status).toBe("IN_REVIEW");

    const published = await call("POST", status.POST, { as: reviewer, params, body: { action: "publish" } });
    expect(published.status).toBe(201);
    expect(published.data.status).toBe("PUBLISHED");
    expect(published.data.reviewerId).toBe(reviewer.id);

    const log = await db.auditLog.findFirst({ where: { action: "scenario.publish", targetId: s.id } });
    expect(log?.actorId).toBe(reviewer.id);
  });

  it("a draft can't skip review", async () => {
    const s = await scenario(author.id);
    const res = await call("POST", status.POST, { as: reviewer, params: { id: s.id }, body: { action: "publish" } });
    expect(res.status).toBe(409);
  });

  it("an admin may publish their own scenario", async () => {
    const s = await scenario(admin.id, "IN_REVIEW");
    const res = await call("POST", status.POST, { as: admin, params: { id: s.id }, body: { action: "publish" } });
    expect(res.status).toBe(201);
  });

  it("a scenario in review is locked, so the reviewer can't publish their own changes", async () => {
    const s = await scenario(author.id, "IN_REVIEW");
    const params = { id: s.id };

    expect((await call("PATCH", one.PATCH, { as: reviewer, params, body: { title: "Rewritten by the reviewer" } })).status).toBe(409);
    expect(
      (
        await call("PATCH", child.PATCH, {
          as: reviewer,
          params: { id: s.id, collection: "actions", itemId: s.actions.asa.id },
          body: { label: "ASA 650 mg" },
        })
      ).status,
    ).toBe(409);
    expect(
      (await call("POST", collection.POST, { as: author, params: { id: s.id, collection: "actions" }, body: { category: "ASSESSMENT", label: "Late addition" } }))
        .status,
    ).toBe(409);

    // Sending it back to draft is how changes get made, and then it needs review again.
    const back = await call("POST", status.POST, { as: reviewer, params, body: { action: "unpublish" } });
    expect(back.data.status).toBe("DRAFT");
    expect((await call("PATCH", one.PATCH, { as: reviewer, params, body: { title: "Fixed by the reviewer" } })).status).toBe(200);
  });

  it("a published scenario can't be edited in place", async () => {
    const s = await scenario(author.id, "PUBLISHED");
    const res = await call("PATCH", one.PATCH, { as: author, params: { id: s.id }, body: { title: "Quiet change" } });
    expect(res.status).toBe(409);
  });
});

describe("child items stay inside their own scenario", () => {
  it("an item from another scenario can't be changed or deleted through this one", async () => {
    const mine = await scenario(author.id);
    const theirs = await scenario(reviewer.id);
    const params = { id: mine.id, collection: "actions", itemId: theirs.actions.ecg.id };

    expect((await call("PATCH", child.PATCH, { as: author, params, body: { label: "Hijacked" } })).status).toBe(404);
    expect((await call("DELETE", child.DELETE, { as: author, params })).status).toBe(404);
    expect((await db.scenarioAction.findUniqueOrThrow({ where: { id: theirs.actions.ecg.id } })).label).toBe("12-lead ECG");
  });

  it("a rule can't point at another scenario's states or actions", async () => {
    const mine = await scenario(author.id);
    const theirs = await scenario(reviewer.id);
    const res = await call("POST", collection.POST, {
      as: author,
      params: { id: mine.id, collection: "rules" },
      body: {
        fromStateId: mine.start.id,
        actionId: theirs.actions.ecg.id,
        outcome: "CORRECT",
        points: 5,
        rationale: "Borrowed from elsewhere.",
      },
    });
    expect(res.status).toBe(422);
  });

  it("reordering can't pull in another scenario's items", async () => {
    const mine = await scenario(author.id);
    const theirs = await scenario(reviewer.id);
    const res = await call("PUT", order.PUT, {
      as: author,
      params: { id: mine.id, collection: "states" },
      body: { ids: [mine.start.id, theirs.start.id] },
    });
    expect(res.status).toBe(422);
  });
});
