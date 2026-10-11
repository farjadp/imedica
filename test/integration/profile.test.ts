import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import * as avatar from "@/app/api/v1/me/avatar/route";
import * as password from "@/app/api/v1/me/password/route";
import * as me from "@/app/api/v1/me/route";
import * as papers from "@/app/api/v1/papers/[source]/[id]/save/route";
import * as saved from "@/app/api/v1/papers/saved/route";
import { hashPassword } from "@/server/auth/password";
import { db } from "@/server/db";
import { notifyWindowOpened } from "@/server/push";

import { type Person, call, organization, person } from "./helpers";
import { setRequestHeaders } from "./request-context";

// The fuller profile: details a paramedic keeps about themselves, a photo,
// a password change from the app, and a reading list.

const PASSWORD = "correct horse battery staple";
// The smallest valid JPEG header the sniffer accepts, padded out.
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(60).fill(0)]);

let orgId: string;

beforeAll(async () => {
  orgId = (await organization("Lakeshore Paramedic Services")).id;
});

async function upload(as: Person, bytes: Uint8Array<ArrayBuffer>, method: "POST" | "DELETE" = "POST") {
  const headers = new Headers({ authorization: `Bearer ${as.token}` });
  setRequestHeaders(headers);
  const body = new FormData();
  body.append("file", new File([bytes], "photo.jpg"));
  const req = new Request("http://localhost:3000/api/v1/me/avatar", { method, headers, body: method === "POST" ? body : undefined });
  const res = await (method === "POST" ? avatar.POST : avatar.DELETE)(req, { params: Promise.resolve({}) });
  return { status: res.status, json: await res.json() };
}

describe("updating your profile", () => {
  it("changes only the fields sent and shows them on /me", async () => {
    const medic = await person("PARAMEDIC", orgId);
    const res = await call("PATCH", me.PATCH, {
      as: medic,
      body: { preferredName: "Sam", station: "Station 4", certifications: ["ACLS", "PALS", "ACLS"], bio: "  " },
    });
    expect(res.status).toBe(200);

    const after = (await call("GET", me.GET, { as: medic })).data;
    expect(after).toMatchObject({ preferredName: "Sam", station: "Station 4", bio: null, level: "PCP", yearsExperience: 4 });
    expect(after.certifications).toEqual(["ACLS", "PALS"]);
  });

  it("refuses an empty name and an overlong bio", async () => {
    const medic = await person("PARAMEDIC", orgId);
    expect((await call("PATCH", me.PATCH, { as: medic, body: { firstName: " " } })).status).toBe(422);
    expect((await call("PATCH", me.PATCH, { as: medic, body: { bio: "x".repeat(281) } })).status).toBe(422);
  });

  it("can't touch role, email or organization", async () => {
    const medic = await person("PARAMEDIC", orgId);
    await call("PATCH", me.PATCH, { as: medic, body: { role: "ADMIN", email: "x@y.test", organizationId: null, station: "S1" } });
    const row = await db.user.findUniqueOrThrow({ where: { id: medic.id } });
    expect(row).toMatchObject({ role: "PARAMEDIC", organizationId: orgId, station: "S1" });
  });
});

describe("profile photo", () => {
  it("stores a real image and serves it back only to its owner", async () => {
    const medic = await person("PARAMEDIC", orgId);
    const res = await upload(medic, JPEG);
    expect(res.status).toBe(201);
    expect((await call("GET", me.GET, { as: medic })).data.avatarVersion).toBe(res.json.data.avatarVersion);

    setRequestHeaders(new Headers({ authorization: `Bearer ${medic.token}` }));
    const img = await avatar.GET(new Request("http://localhost:3000/api/v1/me/avatar"), { params: Promise.resolve({}) });
    expect(img.status).toBe(200);
    expect(img.headers.get("content-type")).toBe("image/jpeg");
    expect(img.headers.get("cache-control")).toMatch(/^private/);

    setRequestHeaders(new Headers());
    const anon = await avatar.GET(new Request("http://localhost:3000/api/v1/me/avatar"), { params: Promise.resolve({}) });
    expect(anon.status).toBe(401);
  });

  it("refuses something that isn't an image, whatever it's called", async () => {
    const medic = await person("PARAMEDIC", orgId);
    expect((await upload(medic, new TextEncoder().encode("<svg onload=alert(1)>"))).status).toBe(415);
  });

  it("can be removed", async () => {
    const medic = await person("PARAMEDIC", orgId);
    await upload(medic, JPEG);
    expect((await upload(medic, JPEG, "DELETE")).status).toBe(200);
    expect(await db.userAvatar.findUnique({ where: { userId: medic.id } })).toBeNull();
    expect((await call("GET", me.GET, { as: medic })).data.avatarVersion).toBeNull();
  });
});

describe("changing your password from the app", () => {
  it("needs the current password", async () => {
    const medic = await person("PARAMEDIC", orgId);
    await db.user.update({ where: { id: medic.id }, data: { passwordHash: await hashPassword(PASSWORD) } });
    const res = await call("POST", password.POST, { as: medic, body: { current: "wrong", password: "a-new-pass-123", confirm: "a-new-pass-123" } });
    expect(res.status).toBe(403);
  });

  it("returns a new token and signs every old session out", async () => {
    const medic = await person("PARAMEDIC", orgId);
    await db.user.update({ where: { id: medic.id }, data: { passwordHash: await hashPassword(PASSWORD) } });
    const res = await call("POST", password.POST, { as: medic, body: { current: PASSWORD, password: "a-new-pass-123", confirm: "a-new-pass-123" } });
    expect(res.status).toBe(201);
    expect(res.data.token).toEqual(expect.any(String));

    expect((await call("GET", me.GET, { as: medic })).status).toBe(401);
    expect((await call("GET", me.GET, { as: { ...medic, token: res.data.token } })).status).toBe(200);
  });
});

describe("notification preference", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("a paramedic who turned test notices off doesn't get one", async () => {
    const service = (await organization("Quiet EMS")).id;
    const on = await person("PARAMEDIC", service);
    const off = await person("PARAMEDIC", service);
    await call("PATCH", me.PATCH, { as: off, body: { notifyAssessments: false } });
    await db.pushDevice.createMany({
      data: [
        { userId: on.id, token: "ExponentPushToken[pref-on]", platform: "ios" },
        { userId: off.id, token: "ExponentPushToken[pref-off]", platform: "ios" },
      ],
    });
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const sent = JSON.parse(init.body as string) as unknown[];
      return new Response(JSON.stringify({ data: sent.map(() => ({ status: "ok" })) }));
    });
    vi.stubGlobal("fetch", fetchMock);

    await notifyWindowOpened(service, "POST", "window-2");
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { to: string }[];
    expect(sent.map((m) => m.to)).toEqual(["ExponentPushToken[pref-on]"]);
  });
});

describe("reading list", () => {
  it("rejects a made-up source before it reaches the index", async () => {
    const medic = await person("PARAMEDIC", orgId);
    const res = await call("DELETE", papers.DELETE, { as: medic, params: { source: "../etc", id: "1" } });
    expect(res.status).toBe(404);
  });

  it("is yours alone", async () => {
    const a = await person("PARAMEDIC", orgId);
    const b = await person("PARAMEDIC", orgId);
    await db.savedPaper.create({ data: { userId: a.id, source: "MED", extId: "123456", title: "A paper" } });
    expect((await call("GET", saved.GET, { as: a })).data).toHaveLength(1);
    expect((await call("GET", saved.GET, { as: b })).data).toHaveLength(0);

    // Unsaving someone else's entry does nothing to it.
    await call("DELETE", papers.DELETE, { as: b, params: { source: "MED", id: "123456" } });
    expect(await db.savedPaper.count({ where: { userId: a.id } })).toBe(1);
  });
});
