import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import * as login from "@/app/api/v1/auth/login/route";
import * as devices from "@/app/api/v1/me/devices/route";
import * as me from "@/app/api/v1/me/route";
import { hashPassword } from "@/server/auth/password";
import { db } from "@/server/db";
import { notifyWindowOpened } from "@/server/push";

import { type Person, call, organization, person } from "./helpers";

// What the mobile app needs beyond the web: a limiter every instance shares,
// deleting your own account, and push devices.

const PASSWORD = "correct horse battery staple";
const tokenFor = (n: number | string) => `ExponentPushToken[device-${n}]`;

let orgId: string;

beforeAll(async () => {
  orgId = (await organization("Lakeshore Paramedic Services")).id;
});

async function withPassword(p: Person) {
  await db.user.update({ where: { id: p.id }, data: { passwordHash: await hashPassword(PASSWORD) } });
  return p;
}

describe("shared rate limiter", () => {
  it("the ninth sign-in for one email in fifteen minutes is refused", async () => {
    const medic = await person("PARAMEDIC", orgId);
    const { email } = await db.user.findUniqueOrThrow({ where: { id: medic.id } });

    for (let i = 0; i < 8; i++) {
      expect((await call("POST", login.POST, { body: { email, password: "wrong" } })).status).toBe(401);
    }
    const ninth = await call("POST", login.POST, { body: { email, password: "wrong" } });
    expect(ninth.status).toBe(429);

    // The counter lives in Postgres under a hash, not the address.
    const keys = await db.rateLimitBucket.findMany({ select: { key: true } });
    expect(keys.some((k) => k.key.includes("@"))).toBe(false);
  });

  it("another email is still let through", async () => {
    const res = await call("POST", login.POST, { body: { email: "someone-else@example.test", password: "wrong" } });
    expect(res.status).toBe(401);
  });
});

describe("deleting your own account", () => {
  it("a wrong password leaves the account alone", async () => {
    const medic = await withPassword(await person("PARAMEDIC", orgId));
    const res = await call("DELETE", me.DELETE, { as: medic, body: { password: "nope" } });
    expect(res.status).toBe(403);
    expect(await db.user.findUnique({ where: { id: medic.id } })).not.toBeNull();
  });

  it("staff go through support", async () => {
    const physician = await withPassword(await person("PHYSICIAN"));
    const res = await call("DELETE", me.DELETE, { as: physician, body: { password: PASSWORD } });
    expect(res.status).toBe(403);
    expect(await db.user.findUnique({ where: { id: physician.id } })).not.toBeNull();
  });

  it("a paramedic's account, sessions and devices go", async () => {
    const medic = await withPassword(await person("PARAMEDIC", orgId));
    await call("POST", devices.POST, { as: medic, body: { token: tokenFor("deleted"), platform: "ios" } });

    const res = await call("DELETE", me.DELETE, { as: medic, body: { password: PASSWORD } });
    expect(res.status).toBe(200);
    expect(await db.user.findUnique({ where: { id: medic.id } })).toBeNull();
    expect(await db.pushDevice.findUnique({ where: { token: tokenFor("deleted") } })).toBeNull();
    expect((await call("GET", me.GET, { as: medic })).status).toBe(401);

    const log = await db.auditLog.findFirst({ where: { action: "account.delete", actorId: medic.id } });
    expect(log).not.toBeNull();
  });
});

describe("push devices", () => {
  it("rejects something that isn't an Expo token", async () => {
    const medic = await person("PARAMEDIC", orgId);
    const res = await call("POST", devices.POST, { as: medic, body: { token: "abc", platform: "ios" } });
    expect(res.status).toBe(422);
  });

  it("a token follows whoever signed in last", async () => {
    const first = await person("PARAMEDIC", orgId);
    const second = await person("PARAMEDIC", orgId);
    await call("POST", devices.POST, { as: first, body: { token: tokenFor("shared"), platform: "android" } });
    await call("POST", devices.POST, { as: second, body: { token: tokenFor("shared"), platform: "android" } });
    const row = await db.pushDevice.findUniqueOrThrow({ where: { token: tokenFor("shared") } });
    expect(row.userId).toBe(second.id);
  });

  it("you can't unregister someone else's phone", async () => {
    const owner = await person("PARAMEDIC", orgId);
    const other = await person("PARAMEDIC", orgId);
    await call("POST", devices.POST, { as: owner, body: { token: tokenFor("mine"), platform: "ios" } });
    await call("DELETE", devices.DELETE, { as: other, body: { token: tokenFor("mine") } });
    expect(await db.pushDevice.findUnique({ where: { token: tokenFor("mine") } })).not.toBeNull();

    await call("DELETE", devices.DELETE, { as: owner, body: { token: tokenFor("mine") } });
    expect(await db.pushDevice.findUnique({ where: { token: tokenFor("mine") } })).toBeNull();
  });
});

describe("window-opened notification", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reaches the service's active paramedics only, says nothing clinical, and drops dead tokens", async () => {
    const service = (await organization("Harbour EMS")).id;
    const active = await person("PARAMEDIC", service);
    const inactive = await person("PARAMEDIC", service, { active: false });
    const lead = await person("INSTRUCTOR", service);
    const elsewhere = await person("PARAMEDIC", orgId);
    await db.pushDevice.createMany({
      data: [
        { userId: active.id, token: tokenFor("active-1"), platform: "ios" },
        { userId: active.id, token: tokenFor("active-dead"), platform: "android" },
        { userId: inactive.id, token: tokenFor("inactive"), platform: "ios" },
        { userId: lead.id, token: tokenFor("lead"), platform: "ios" },
        { userId: elsewhere.id, token: tokenFor("elsewhere"), platform: "ios" },
      ],
    });

    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const sent = JSON.parse(init.body as string) as { to: string }[];
      return new Response(
        JSON.stringify({
          data: sent.map((m) =>
            m.to === tokenFor("active-dead")
              ? { status: "error", details: { error: "DeviceNotRegistered" } }
              : { status: "ok" },
          ),
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await notifyWindowOpened(service, "PRE", "window-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { to: string; title: string; body: string }[];
    expect(sent.map((m) => m.to).sort()).toEqual([tokenFor("active-1"), tokenFor("active-dead")].sort());
    expect(sent[0].title).toBe("Your pre-test is open");
    expect(JSON.stringify(sent)).not.toMatch(/score|correct|harmful/i);

    expect(await db.pushDevice.findUnique({ where: { token: tokenFor("active-dead") } })).toBeNull();
    expect(await db.pushDevice.findUnique({ where: { token: tokenFor("active-1") } })).not.toBeNull();
  });

  it("no devices, no request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await notifyWindowOpened((await organization("Empty Service")).id, "POST", "window-2");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
