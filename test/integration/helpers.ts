import type { NextResponse } from "next/server";

import type { Role } from "@/generated/prisma/enums";
import { hashToken, newToken } from "@/server/auth/tokens";
import { db } from "@/server/db";

import { setRequestHeaders } from "./request-context";

// ─── Calling a route handler ────────────────────────────────────────────────

type Handler<P> = (req: Request, ctx: { params: Promise<P> }) => Promise<NextResponse>;

export type Call<P> = {
  as?: Person | null;
  params?: P;
  body?: unknown;
  query?: Record<string, string>;
  headers?: Record<string, string>;
};

// Tests poke at response bodies of every shape; typing each one adds nothing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Result = { status: number; data: any; error: any };

/**
 * Sends one request straight to an exported handler (GET, POST, …), signed in
 * as `as` with a bearer token. The method comes from the request we build, so
 * pass the handler that matches it.
 */
export async function call<P>(method: string, handler: Handler<P>, opts: Call<P> = {}): Promise<Result> {
  const url = new URL("http://localhost:3000/api/v1/test");
  for (const [k, v] of Object.entries(opts.query ?? {})) url.searchParams.set(k, v);

  const headers = new Headers(opts.headers);
  if (opts.as) headers.set("authorization", `Bearer ${opts.as.token}`);
  if (opts.body !== undefined) headers.set("content-type", "application/json");
  setRequestHeaders(headers);

  const req = new Request(url, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const res = await handler(req, { params: Promise.resolve((opts.params ?? {}) as P) });
  const json = await res.json();
  return { status: res.status, data: json.data, error: json.error };
}

// ─── People ─────────────────────────────────────────────────────────────────

export type Person = { id: string; token: string; role: Role; organizationId: string | null };

let seq = 0;

export async function organization(name: string, opts: { active?: boolean; seatLimit?: number } = {}) {
  seq += 1;
  return db.organization.create({
    data: { name, slug: `${name.toLowerCase().replace(/\W+/g, "-")}-${seq}`, ...opts },
  });
}

/** A user with a live session. Nothing here goes through the sign-in flow. */
export async function person(
  role: Role,
  organizationId: string | null = null,
  opts: { active?: boolean; expired?: boolean } = {},
): Promise<Person> {
  seq += 1;
  const user = await db.user.create({
    data: {
      email: `${role.toLowerCase()}-${seq}@example.test`,
      passwordHash: "not-a-real-hash",
      firstName: role,
      lastName: String(seq),
      role,
      organizationId,
      active: opts.active ?? true,
      level: role === "PARAMEDIC" ? "PCP" : null,
      yearsExperience: role === "PARAMEDIC" ? 4 : null,
    },
  });
  const token = newToken();
  await db.authSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + (opts.expired ? -1 : 1) * 24 * 60 * 60 * 1000),
    },
  });
  return { id: user.id, token, role, organizationId };
}

// ─── Scenarios ──────────────────────────────────────────────────────────────

/**
 * The smallest scenario that passes the publish check: a start and an end
 * state, three actions, and one required rule that ends the call.
 */
export async function scenario(authorId: string, status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" = "DRAFT") {
  seq += 1;
  const s = await db.scenario.create({
    data: {
      slug: `test-scenario-${seq}`,
      title: `Test scenario ${seq}`,
      summary: "A short call used by the authorization tests.",
      dispatch: "Priority 4. Adult, chest pain.",
      category: "CARDIAC",
      status,
      authorId,
      timeLimitSec: 600,
      ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
    },
  });
  const start = await db.scenarioState.create({
    data: { scenarioId: s.id, order: 0, title: "On scene", narrative: "Patient seated.", vitals: {}, isStart: true },
  });
  const end = await db.scenarioState.create({
    data: { scenarioId: s.id, order: 1, title: "Handover", narrative: "Care handed over.", vitals: {}, isTerminal: true },
  });
  const [ecg, asa, transport] = await Promise.all(
    (
      [
        ["ASSESSMENT", "12-lead ECG"],
        ["MEDICATION", "ASA 162 mg"],
        ["TRANSPORT", "Transport to PCI centre"],
      ] as const
    ).map(([category, label], order) =>
      db.scenarioAction.create({ data: { scenarioId: s.id, category, label, order } }),
    ),
  );
  await db.scenarioRule.create({
    data: {
      scenarioId: s.id,
      fromStateId: start.id,
      actionId: transport.id,
      outcome: "CORRECT",
      points: 10,
      toStateId: end.id,
      required: true,
      rationale: "Get the patient to definitive care.",
    },
  });
  return { ...s, start, end, actions: { ecg, asa, transport } };
}

/** For server actions, which read the signed-in user the same way routes do. */
export function signIn(as: Person | null) {
  setRequestHeaders(new Headers(as ? { authorization: `Bearer ${as.token}` } : {}));
}

export function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}
