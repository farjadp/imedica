import { beforeAll, describe, expect, it } from "vitest";

import * as close from "@/app/api/v1/assessment-windows/[id]/close/route";
import * as windows from "@/app/api/v1/assessment-windows/route";
import { db } from "@/server/db";

import { type Person, assessment, call, organization, person, scenario } from "./helpers";

// Training leads open and close their own service's windows; nobody else's.

let lakeshoreId: string;
let harbourId: string;
let admin: Person;
let physician: Person;
let lead: Person;
let otherLead: Person;
let medic: Person;
let publishedScenarioId: string;

beforeAll(async () => {
  lakeshoreId = (await organization("Lakeshore Paramedic Services")).id;
  harbourId = (await organization("Harbour EMS")).id;
  admin = await person("ADMIN");
  physician = await person("PHYSICIAN");
  lead = await person("INSTRUCTOR", lakeshoreId);
  otherLead = await person("INSTRUCTOR", harbourId);
  medic = await person("PARAMEDIC", lakeshoreId);
  publishedScenarioId = (await scenario(physician.id, "PUBLISHED")).id;
});

const published = () => assessment(physician.id, [publishedScenarioId], "PUBLISHED");

describe("who may manage windows", () => {
  it.each([
    ["a paramedic", () => medic],
    ["a physician", () => physician],
  ])("%s can't list or open them", async (_who, who) => {
    const a = await published();
    expect((await call("GET", windows.GET, { as: who() })).status).toBe(403);
    expect((await call("POST", windows.POST, { as: who(), body: { assessmentId: a.id, phase: "PRE" } })).status).toBe(403);
  });
});

describe("a training lead is pinned to their own service", () => {
  it("opens the pre-test for their own service", async () => {
    const a = await published();
    const res = await call("POST", windows.POST, { as: lead, body: { assessmentId: a.id, phase: "PRE" } });
    expect(res.status).toBe(201);
    expect(res.data.organizationId).toBe(lakeshoreId);
  });

  it("can't open one for another service", async () => {
    const a = await published();
    const res = await call("POST", windows.POST, {
      as: lead,
      body: { assessmentId: a.id, phase: "PRE", organizationId: harbourId },
    });
    expect(res.status).toBe(403);
  });

  it("can't close another service's window, and it looks missing", async () => {
    const a = await published();
    const theirs = await call("POST", windows.POST, { as: otherLead, body: { assessmentId: a.id, phase: "PRE" } });
    const res = await call("POST", close.POST, { as: lead, params: { id: theirs.data.id } });
    expect(res.status).toBe(404);
    expect((await db.assessmentWindow.findUniqueOrThrow({ where: { id: theirs.data.id } })).closesAt).toBeNull();
  });

  it("only sees their own service's windows", async () => {
    const a = await published();
    await call("POST", windows.POST, { as: otherLead, body: { assessmentId: a.id, phase: "PRE" } });
    const res = await call("GET", windows.GET, { as: lead });
    expect(res.data.organizationId).toBe(lakeshoreId);
    expect(res.data.assessments.find((x: { id: string }) => x.id === a.id).pre).toBeNull();
    expect((await call("GET", windows.GET, { as: lead, query: { organizationId: harbourId } })).status).toBe(403);
  });
});

describe("the order of things", () => {
  it("only published assessments can be opened", async () => {
    const draft = await assessment(physician.id, [publishedScenarioId], "DRAFT");
    expect((await call("POST", windows.POST, { as: lead, body: { assessmentId: draft.id, phase: "PRE" } })).status).toBe(404);
  });

  it("the post-test needs a pre-test first", async () => {
    const a = await published();
    expect((await call("POST", windows.POST, { as: lead, body: { assessmentId: a.id, phase: "POST" } })).status).toBe(409);
  });

  it("each phase opens once per service", async () => {
    const a = await published();
    await call("POST", windows.POST, { as: lead, body: { assessmentId: a.id, phase: "PRE" } });
    expect((await call("POST", windows.POST, { as: lead, body: { assessmentId: a.id, phase: "PRE" } })).status).toBe(409);
  });

  it("opening the post-test closes the pre-test", async () => {
    const a = await published();
    const pre = await call("POST", windows.POST, { as: lead, body: { assessmentId: a.id, phase: "PRE" } });
    expect((await call("POST", windows.POST, { as: lead, body: { assessmentId: a.id, phase: "POST" } })).status).toBe(201);
    expect((await db.assessmentWindow.findUniqueOrThrow({ where: { id: pre.data.id } })).closesAt).not.toBeNull();
  });

  it("an admin must pick a service, and may pick any", async () => {
    const a = await published();
    expect((await call("POST", windows.POST, { as: admin, body: { assessmentId: a.id, phase: "PRE" } })).status).toBe(400);
    const res = await call("POST", windows.POST, {
      as: admin,
      body: { assessmentId: a.id, phase: "PRE", organizationId: harbourId },
    });
    expect(res.status).toBe(201);
  });
});

describe("completion counts", () => {
  it("are withheld below k", async () => {
    const a = await published();
    const pre = await call("POST", windows.POST, { as: lead, body: { assessmentId: a.id, phase: "PRE" } });
    await db.assessmentAttempt.create({
      data: { assessmentId: a.id, windowId: pre.data.id, phase: "PRE", anonymousHash: "x", completedAt: new Date() },
    });
    const res = await call("GET", windows.GET, { as: lead });
    const row = res.data.assessments.find((x: { id: string }) => x.id === a.id);
    expect(row.pre).toMatchObject({ open: true, suppressed: true, completed: null });
  });
});
