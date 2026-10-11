import { beforeAll, describe, expect, it } from "vitest";

import { changeRole, inviteUser, revokeInvitation, setActive } from "@/server/admin/actions";
import { hashToken, newToken } from "@/server/auth/tokens";
import { db } from "@/server/db";

import { type Person, form, organization, person, signIn } from "./helpers";

// People management (server actions behind Admin → People). A training lead
// manages their own service; Imedica admins manage everyone.

let lakeshoreId: string;
let harbourId: string;
let admin: Person;
let lead: Person;
let medic: Person;
let otherMedic: Person;

beforeAll(async () => {
  lakeshoreId = (await organization("Lakeshore Paramedic Services")).id;
  harbourId = (await organization("Harbour EMS")).id;
  admin = await person("ADMIN");
  lead = await person("INSTRUCTOR", lakeshoreId);
  medic = await person("PARAMEDIC", lakeshoreId);
  otherMedic = await person("PARAMEDIC", harbourId);
});

async function invitation(organizationId: string) {
  return db.invitation.create({
    data: {
      email: `invitee-${Math.random().toString(36).slice(2)}@example.test`,
      role: "PARAMEDIC",
      organizationId,
      tokenHash: hashToken(newToken()),
      invitedById: admin.id,
      expiresAt: new Date(Date.now() + 864e5),
    },
  });
}

describe("inviting", () => {
  it("a paramedic can't invite anyone", async () => {
    signIn(medic);
    const res = await inviteUser({}, form({ email: "new@example.test", role: "PARAMEDIC" }));
    expect(res.ok).toBeFalsy();
    expect(await db.invitation.count({ where: { email: "new@example.test" } })).toBe(0);
  });

  it("a training lead's invitation always lands in their own service", async () => {
    signIn(lead);
    const res = await inviteUser({}, form({ email: "mine@example.test", role: "PARAMEDIC" }));
    expect(res.ok).toBe(true);
    const invite = await db.invitation.findFirstOrThrow({ where: { email: "mine@example.test" } });
    expect(invite.organizationId).toBe(lakeshoreId);
  });

  it("a training lead can't invite into another service", async () => {
    signIn(lead);
    const res = await inviteUser({}, form({ email: "theirs@example.test", role: "PARAMEDIC", organizationId: harbourId }));
    expect(res.ok).toBeFalsy();
    expect(await db.invitation.count({ where: { email: "theirs@example.test" } })).toBe(0);
  });

  it.each(["PHYSICIAN", "ADMIN"])("a training lead can't invite a %s", async (role) => {
    signIn(lead);
    const email = `${role.toLowerCase()}-invite@example.test`;
    const res = await inviteUser({}, form({ email, role }));
    expect(res.ok).toBeFalsy();
    expect(await db.invitation.count({ where: { email } })).toBe(0);
  });

  it("an admin can invite into any service", async () => {
    signIn(admin);
    const res = await inviteUser({}, form({ email: "harbour@example.test", role: "INSTRUCTOR", organizationId: harbourId }));
    expect(res.ok).toBe(true);
  });
});

describe("managing people", () => {
  it("a training lead can't change someone at another service", async () => {
    signIn(lead);
    expect((await changeRole({}, form({ userId: otherMedic.id, role: "INSTRUCTOR" }))).ok).toBeFalsy();
    expect((await setActive({}, form({ userId: otherMedic.id, active: "false" }))).ok).toBeFalsy();
    const after = await db.user.findUniqueOrThrow({ where: { id: otherMedic.id } });
    expect(after).toMatchObject({ role: "PARAMEDIC", active: true });
  });

  it("a training lead can't promote anyone to physician or admin", async () => {
    signIn(lead);
    expect((await changeRole({}, form({ userId: medic.id, role: "ADMIN" }))).ok).toBeFalsy();
    expect((await db.user.findUniqueOrThrow({ where: { id: medic.id } })).role).toBe("PARAMEDIC");
  });

  it("nobody can change their own account here", async () => {
    signIn(lead);
    expect((await setActive({}, form({ userId: lead.id, active: "false" }))).ok).toBeFalsy();
  });

  it("deactivating someone ends their sessions", async () => {
    const leaving = await person("PARAMEDIC", lakeshoreId);
    signIn(lead);
    expect((await setActive({}, form({ userId: leaving.id, active: "false" }))).ok).toBe(true);
    expect(await db.authSession.count({ where: { userId: leaving.id } })).toBe(0);
  });

  it("a role change ends the person's sessions, so the old role stops working at once", async () => {
    const promoted = await person("PARAMEDIC", lakeshoreId);
    signIn(lead);
    expect((await changeRole({}, form({ userId: promoted.id, role: "INSTRUCTOR" }))).ok).toBe(true);
    expect(await db.authSession.count({ where: { userId: promoted.id } })).toBe(0);
  });
});

describe("revoking invitations", () => {
  it("a training lead can't revoke another service's invitation", async () => {
    const theirs = await invitation(harbourId);
    signIn(lead);
    expect((await revokeInvitation({}, form({ invitationId: theirs.id }))).ok).toBeFalsy();
    expect(await db.invitation.count({ where: { id: theirs.id } })).toBe(1);
  });

  it("but can revoke their own", async () => {
    const mine = await invitation(lakeshoreId);
    signIn(lead);
    expect((await revokeInvitation({}, form({ invitationId: mine.id }))).ok).toBe(true);
    expect(await db.invitation.count({ where: { id: mine.id } })).toBe(0);
  });
});
