import { beforeAll, describe, expect, it } from "vitest";

import * as accept from "@/app/api/v1/invitations/[token]/accept/route";
import * as invitation from "@/app/api/v1/invitations/[token]/route";
import * as me from "@/app/api/v1/me/route";
import { hashToken, newToken } from "@/server/auth/tokens";
import { db } from "@/server/db";

import { call, organization, person } from "./helpers";

// Joining from the app: read the invitation, then accept it and get a session.

const PASSWORD = "a-good-password-2026";
let orgId: string;
let inviterId: string;

beforeAll(async () => {
  orgId = (await organization("Lakeshore Paramedic Services")).id;
  inviterId = (await person("INSTRUCTOR", orgId)).id;
});

async function invite(email: string, opts: { expired?: boolean; used?: boolean } = {}) {
  const token = newToken();
  await db.invitation.create({
    data: {
      email,
      role: "PARAMEDIC",
      organizationId: orgId,
      tokenHash: hashToken(token),
      invitedById: inviterId,
      expiresAt: new Date(Date.now() + (opts.expired ? -1 : 1) * 864e5),
      acceptedAt: opts.used ? new Date() : null,
    },
  });
  return token;
}

const body = { firstName: "Sam", lastName: "Reyes", level: "PCP", yearsExperience: 3, password: PASSWORD, confirm: PASSWORD };

describe("reading an invitation", () => {
  it("shows who it's for and the service", async () => {
    const token = await invite("sam.read@example.test");
    const res = await call("GET", invitation.GET, { params: { token } });
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({ email: "sam.read@example.test", role: "PARAMEDIC", organizationName: "Lakeshore Paramedic Services" });
  });

  it.each([
    ["unknown", async () => "no-such-token-0000000000000"],
    ["expired", () => invite("old@example.test", { expired: true })],
    ["used", () => invite("used@example.test", { used: true })],
  ])("an %s invitation is a 404 that names nobody", async (_kind, make) => {
    const res = await call("GET", invitation.GET, { params: { token: await make() } });
    expect(res.status).toBe(404);
    expect(JSON.stringify(res)).not.toContain("@example.test");
  });
});

describe("accepting in the app", () => {
  it("creates the account, uses up the invitation and returns a working token", async () => {
    const token = await invite("sam.join@example.test");
    const res = await call("POST", accept.POST, { params: { token }, body });
    expect(res.status).toBe(201);
    expect(res.data.token).toEqual(expect.any(String));

    const signedIn = await call("GET", me.GET, { as: { id: "", role: "PARAMEDIC", organizationId: orgId, token: res.data.token } });
    expect(signedIn.data).toMatchObject({ email: "sam.join@example.test", firstName: "Sam", level: "PCP", organizationId: orgId });

    const again = await call("POST", accept.POST, { params: { token }, body });
    expect(again.status).toBe(410);
  });

  it("refuses mismatched passwords and a weak one", async () => {
    const token = await invite("sam.weak@example.test");
    expect((await call("POST", accept.POST, { params: { token }, body: { ...body, confirm: "different-password-1" } })).status).toBe(422);
    expect((await call("POST", accept.POST, { params: { token }, body: { ...body, password: "short", confirm: "short" } })).status).toBe(422);
    expect(await db.user.findUnique({ where: { email: "sam.weak@example.test" } })).toBeNull();
  });

  it("won't make a second account for an email that already has one", async () => {
    const existing = await person("PARAMEDIC", orgId);
    const { email } = await db.user.findUniqueOrThrow({ where: { id: existing.id } });
    const token = await invite(email);
    expect((await call("POST", accept.POST, { params: { token }, body })).status).toBe(409);
  });
});
