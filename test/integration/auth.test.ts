import { beforeAll, describe, expect, it } from "vitest";

import * as analytics from "@/app/api/v1/analytics/route";
import * as images from "@/app/api/v1/blog/images/route";
import * as me from "@/app/api/v1/me/route";
import * as scenarios from "@/app/api/v1/scenarios/route";
import * as sessions from "@/app/api/v1/sessions/route";

import { type Person, call, organization, person } from "./helpers";

// Who gets through the front door at all.

let medic: Person;
let expired: Person;
let deactivated: Person;
let lockedOut: Person;

beforeAll(async () => {
  const org = await organization("Lakeshore Paramedic Services");
  const closed = await organization("Closed Service", { active: false });
  medic = await person("PARAMEDIC", org.id);
  expired = await person("PARAMEDIC", org.id, { expired: true });
  deactivated = await person("PARAMEDIC", org.id, { active: false });
  lockedOut = await person("PARAMEDIC", closed.id);
});

describe("signed-out requests", () => {
  it.each([
    ["GET /me", () => call("GET", me.GET)],
    ["GET /sessions", () => call("GET", sessions.GET)],
    ["POST /sessions", () => call("POST", sessions.POST, { body: { scenarioId: "x" } })],
    ["GET /scenarios", () => call("GET", scenarios.GET)],
    ["POST /scenarios", () => call("POST", scenarios.POST, { body: {} })],
    ["GET /analytics", () => call("GET", analytics.GET)],
  ])("%s → 401", async (_name, send) => {
    expect((await send()).status).toBe(401);
  });

  it("an unknown token is treated as signed out", async () => {
    const res = await call("GET", me.GET, { as: { ...medic, token: "not-a-token" } });
    expect(res.status).toBe(401);
  });
});

describe("sessions that no longer count", () => {
  it("an expired session is refused", async () => {
    expect((await call("GET", me.GET, { as: expired })).status).toBe(401);
  });

  it("a deactivated person is refused", async () => {
    expect((await call("GET", me.GET, { as: deactivated })).status).toBe(401);
  });

  it("a deactivated organization locks its members out", async () => {
    expect((await call("GET", me.GET, { as: lockedOut })).status).toBe(401);
  });

  it("a live session gets through", async () => {
    const res = await call("GET", me.GET, { as: medic });
    expect(res.status).toBe(200);
    expect(res.data.id).toBe(medic.id);
  });
});

describe("cross-site writes", () => {
  it("a write from another origin is refused", async () => {
    const res = await call("POST", sessions.POST, {
      as: medic,
      body: { scenarioId: "x" },
      headers: { origin: "https://evil.example" },
    });
    expect(res.status).toBe(403);
  });

  it("a read from another origin is allowed", async () => {
    const res = await call("GET", me.GET, { as: medic, headers: { origin: "https://evil.example" } });
    expect(res.status).toBe(200);
  });
});

describe("blog image upload", () => {
  it("a paramedic can't upload", async () => {
    expect((await call("POST", images.POST, { as: medic, body: {} })).status).toBe(403);
  });
});
