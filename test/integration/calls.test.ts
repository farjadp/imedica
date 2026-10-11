import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import * as one from "@/app/api/v1/calls/[id]/route";
import * as draft from "@/app/api/v1/calls/[id]/draft/route";
import * as importRoute from "@/app/api/v1/calls/import/route";
import * as list from "@/app/api/v1/calls/route";
import { db } from "@/server/db";
import { sampleDraft } from "@/server/calls/draft-fixture";

import { type Person, call, organization, person } from "./helpers";

// EMSDialog calls: internal, physicians and admins only, imports by admins,
// and a Claude draft becomes an ordinary DRAFT scenario owned by the physician.

const flags = vi.hoisted(() => ({ internal: "on" as "on" | "off", key: "test-key" as string | undefined }));
vi.mock("@/server/env", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/server/env")>();
  return { ...real, env: () => ({ ...real.env(), INTERNAL_DATASETS: flags.internal, ANTHROPIC_API_KEY: flags.key }) };
});

const parse = vi.hoisted(() => vi.fn());
vi.mock("@anthropic-ai/sdk", () => {
  class Anthropic {
    static RateLimitError = class extends Error {};
    beta = { messages: { parse } };
  }
  return { default: Anthropic };
});

const dialogue = (n: number) => Array.from({ length: n }, (_, i) => ({ role: i % 2 ? "Patient" : "EMT", utterance: `Line ${i}` }));

function stubHuggingFace() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const url = String(input);
      const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
      if (url.includes("split=train")) {
        return json({ rows: [{ row_idx: 0, row: { protocol: "general - cardiac arrest (protocol 2 - 7)", dialogue: dialogue(6) } }] });
      }
      if (url.includes("split=test")) return json({ rows: [] });
      if (url.includes("/tree/main/EMSDialog-synthetic")) {
        return json([
          { type: "file", path: "EMSDialog-synthetic/000000.json" },
          { type: "file", path: "EMSDialog-synthetic/000001.json" },
        ]);
      }
      if (url.endsWith("000000.json")) return json({ protocol: ["injury - head (protocol 4 - 6)"], dialogue: dialogue(8) });
      if (url.endsWith("000001.json")) return json({ protocol: ["broken"], dialogue: [] });
      return new Response("not found", { status: 404 });
    }),
  );
}

let admin: Person;
let physician: Person;
let lead: Person;
let medic: Person;

beforeAll(async () => {
  const org = await organization("Lakeshore Paramedic Services");
  admin = await person("ADMIN");
  physician = await person("PHYSICIAN");
  lead = await person("INSTRUCTOR", org.id);
  medic = await person("PARAMEDIC", org.id);
});

afterEach(() => {
  flags.internal = "on";
  flags.key = "test-key";
  parse.mockReset();
  vi.unstubAllGlobals();
});

describe("importing EMSDialog", () => {
  it("is for admins only", async () => {
    stubHuggingFace();
    for (const as of [physician, lead, medic]) expect((await call("POST", importRoute.POST, { as })).status).toBe(403);
  });

  it("adds real and synthetic calls, skips empty ones, and is safe to repeat", async () => {
    stubHuggingFace();
    const first = await call("POST", importRoute.POST, { as: admin });
    expect(first.status).toBe(201);
    expect(first.data).toEqual({ added: 2, found: 2 });
    stubHuggingFace();
    expect((await call("POST", importRoute.POST, { as: admin })).data).toEqual({ added: 0, found: 2 });
    const real = await db.dialogueCall.findFirstOrThrow({ where: { source: "EMSDialog-real" } });
    expect(real).toMatchObject({ sourceKey: "train-0", protocol: "General - cardiac arrest", turnCount: 6 });
  });
});

describe("reading calls", () => {
  it("is for physicians and admins", async () => {
    expect((await call("GET", list.GET, { as: physician })).data).toMatchObject({ total: 2, all: 2 });
    for (const as of [lead, medic]) expect((await call("GET", list.GET, { as })).status).toBe(403);
  });

  it("filters by source and protocol", async () => {
    const res = await call("GET", list.GET, { as: physician, query: { source: "EMSDialog-synthetic" } });
    expect(res.data.items.map((c: { protocol: string }) => c.protocol)).toEqual(["Injury - head"]);
    expect(res.data.protocols).toHaveLength(2);
  });

  it("shows the transcript", async () => {
    const c = await db.dialogueCall.findFirstOrThrow({ where: { source: "EMSDialog-real" } });
    const res = await call("GET", one.GET, { as: physician, params: { id: c.id } });
    expect(res.data.turns[0]).toEqual({ role: "EMT", text: "Line 0" });
  });
});

describe("drafting a scenario", () => {
  it("installs Claude's draft as the physician's DRAFT and keeps the reviewer notes", async () => {
    parse.mockResolvedValue({
      parsed_output: sampleDraft,
      stop_reason: "end_turn",
      model: "claude-opus-5-5",
      usage: { input_tokens: 4000, output_tokens: 3000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    });
    const c = await db.dialogueCall.findFirstOrThrow({ where: { source: "EMSDialog-real" } });
    const res = await call("POST", draft.POST, { as: physician, params: { id: c.id } });
    expect(res.status).toBe(201);
    expect(res.data.problems).toEqual([]);
    expect(res.data.notes).toContain("Vitals weren't in the transcript; chosen to fit the story.");

    const scenario = await db.scenario.findUniqueOrThrow({
      where: { id: res.data.scenarioId },
      include: { states: true, actions: true, rules: true },
    });
    expect(scenario).toMatchObject({ status: "DRAFT", authorId: physician.id, title: sampleDraft.title });
    expect(scenario.protocolSource).toMatch(/EMSDialog-real train-0 \(CC BY-NC 4\.0, internal test\)/);
    expect([scenario.states.length, scenario.actions.length, scenario.rules.length]).toEqual([2, 4, 3]);
    expect((await db.dialogueCall.findUniqueOrThrow({ where: { id: c.id } })).draftScenarioId).toBe(scenario.id);

    // The transcript went to Claude, never anything about the physician.
    const prompt = JSON.stringify(parse.mock.calls[0][0].messages);
    expect(prompt).toContain("EMT: Line 0");
    expect(prompt).not.toContain(physician.id);
  });

  it("says so when there's no API key", async () => {
    flags.key = undefined;
    const c = await db.dialogueCall.findFirstOrThrow();
    expect((await call("POST", draft.POST, { as: physician, params: { id: c.id } })).status).toBe(503);
    expect(parse).not.toHaveBeenCalled();
  });

  it("refuses a learner and a training lead", async () => {
    const c = await db.dialogueCall.findFirstOrThrow();
    for (const as of [lead, medic]) expect((await call("POST", draft.POST, { as, params: { id: c.id } })).status).toBe(403);
  });

  it("reports a refusal instead of saving an empty draft", async () => {
    parse.mockResolvedValue({ parsed_output: null, stop_reason: "refusal", model: "x", usage: {} });
    const c = await db.dialogueCall.findFirstOrThrow();
    const before = await db.scenario.count();
    expect((await call("POST", draft.POST, { as: physician, params: { id: c.id } })).status).toBe(502);
    expect(await db.scenario.count()).toBe(before);
  });
});

describe("with INTERNAL_DATASETS off", () => {
  it("every endpoint answers 404, even for an admin", async () => {
    flags.internal = "off";
    const c = await db.dialogueCall.findFirstOrThrow();
    expect((await call("GET", list.GET, { as: admin })).status).toBe(404);
    expect((await call("GET", one.GET, { as: admin, params: { id: c.id } })).status).toBe(404);
    expect((await call("POST", importRoute.POST, { as: admin })).status).toBe(404);
    expect((await call("POST", draft.POST, { as: admin, params: { id: c.id } })).status).toBe(404);
  });
});
