import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";

import { costMicroUsd } from "../ai/guard";
import { audit } from "../audit";
import { CONTENT_ROLES, HttpError } from "../auth/guards";
import type { CurrentUser } from "../auth/session";
import { db } from "../db";
import { env } from "../env";
import { internalDatasetsEnabled } from "../question-bank/service";
import { limited } from "../rate-limit";
import { installScenario } from "../scenarios/library/install";
import { publishProblems } from "../scenarios/publish-check";

import { draftSchema, toScenarioDef } from "./draft-shape";
import { type CallRow, EMSDIALOG, type Turn, syntheticFiles, toCallRow, transcript } from "./emsdialog";

// ============================================================================
// EMS call transcripts from EMSDialog, and scenario drafts written from them
// by Claude. Internal testing only (CC BY-NC 4.0), behind INTERNAL_DATASETS.
// A draft is an ordinary DRAFT scenario: the physician edits it, and the
// two-person rule decides whether it's ever published.
// ============================================================================

function assertAuthor(user: CurrentUser) {
  if (!internalDatasetsEnabled()) throw new HttpError(404, "Not found.");
  if (!CONTENT_ROLES.includes(user.role)) throw new HttpError(403, "Only physicians can use call transcripts.");
}

// ─── Import ─────────────────────────────────────────────────────────────────

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

async function realCalls(): Promise<CallRow[]> {
  const rows: CallRow[] = [];
  for (const split of ["train", "test"] as const) {
    for (let offset = 0; offset < 1000; offset += 100) {
      const page = (await getJson(EMSDIALOG.realRows(split, offset))) as { rows?: { row_idx: number; row: unknown }[] };
      const batch = page.rows ?? [];
      for (const { row_idx, row } of batch) {
        const call = toCallRow(row, "EMSDialog-real", `${split}-${row_idx}`);
        if (call) rows.push(call);
      }
      if (batch.length < 100) break;
    }
  }
  return rows;
}

async function syntheticCalls(): Promise<CallRow[]> {
  const files = syntheticFiles(await getJson(EMSDIALOG.syntheticTree));
  const rows: CallRow[] = [];
  // A few at a time, to be polite to Hugging Face.
  for (let i = 0; i < files.length; i += 16) {
    const batch = await Promise.all(
      files.slice(i, i + 16).map(async (name) => {
        try {
          return toCallRow(await getJson(EMSDIALOG.syntheticFile(name)), "EMSDialog-synthetic", name);
        } catch {
          return null;
        }
      }),
    );
    rows.push(...batch.filter((r): r is CallRow => r !== null));
  }
  return rows;
}

/** Downloads EMSDialog's real and synthetic calls and adds what's new. Admins only; safe to run again. */
export async function importCalls(user: CurrentUser) {
  assertAuthor(user);
  if (user.role !== "ADMIN") throw new HttpError(403, "Only an admin can import a dataset.");
  if (await limited(`calls-import:${user.id}`, 3, 60 * 60 * 1000)) {
    throw new HttpError(429, "That's three imports this hour. Try again later.");
  }
  let rows: CallRow[];
  try {
    rows = [...(await realCalls()), ...(await syntheticCalls())];
  } catch (error) {
    console.error("[calls] EMSDialog download failed", error);
    throw new HttpError(502, "Couldn't download EMSDialog from Hugging Face. Try again in a minute.");
  }
  let added = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const data = rows.slice(i, i + 200).map((r) => ({ ...r, turns: r.turns as unknown as Prisma.InputJsonValue }));
    added += (await db.dialogueCall.createMany({ data, skipDuplicates: true })).count;
  }
  await audit(user, "calls.import", { type: "DialogueCall", id: "EMSDialog" }, { added, found: rows.length });
  return { added, found: rows.length };
}

// ─── Read ───────────────────────────────────────────────────────────────────

const listSchema = z.object({
  q: z.string().trim().max(120).default(""),
  source: z.enum(["", "EMSDialog-real", "EMSDialog-synthetic"]).default(""),
  protocol: z.string().trim().max(200).default(""),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});
const PAGE = 30;

export async function listCalls(user: CurrentUser, url: URL) {
  assertAuthor(user);
  const { q, source, protocol, page } = listSchema.parse(Object.fromEntries(url.searchParams));
  const where: Prisma.DialogueCallWhereInput = {
    AND: [
      source ? { source } : {},
      protocol ? { protocol } : {},
      q ? { protocol: { contains: q, mode: "insensitive" } } : {},
    ],
  };
  const [total, all, items, protocols] = await Promise.all([
    db.dialogueCall.count({ where }),
    db.dialogueCall.count(),
    db.dialogueCall.findMany({
      where,
      orderBy: [{ source: "asc" }, { importedAt: "asc" }, { id: "asc" }],
      skip: (page - 1) * PAGE,
      take: PAGE,
      select: { id: true, source: true, sourceKey: true, protocol: true, turnCount: true, draftScenarioId: true },
    }),
    db.dialogueCall.groupBy({ by: ["protocol"], _count: true, orderBy: { _count: { protocol: "desc" } } }),
  ]);
  return {
    total,
    all,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE)),
    items,
    protocols: protocols.map((p) => ({ protocol: p.protocol, count: p._count })),
  };
}

export async function getCall(user: CurrentUser, id: string) {
  assertAuthor(user);
  const call = await db.dialogueCall.findUnique({ where: { id } });
  if (!call) throw new HttpError(404, "Call not found.");
  return { ...call, turns: call.turns as Turn[] };
}

// ─── Draft a scenario ───────────────────────────────────────────────────────

const SYSTEM = `You help emergency physicians write decision-training scenarios for Canadian paramedics (PCP and ACP).

You are given the transcript of one EMS call. Turn it into a scenario: a dispatch, a few moments in the call with the monitor's vitals, an action menu, and rules that score each action in each moment. Base the patient, the history and the course of the call on the transcript. Where it doesn't say something you need, such as vitals, choose values consistent with the story and list each assumption in reviewerNotes.

Score against the Ontario ALS Patient Care Standards and BLS Patient Care Standards, not the US protocol the crew in the transcript followed. Where the crew did something an Ontario paramedic wouldn't, score it accordingly and say so in reviewerNotes. Include plausible wrong choices on the action menu, with honest rationales. Use doses only as Ontario directives state them; if unsure of a dose, leave it out of the label and say so in reviewerNotes.

Write narratives in present tense, plain Canadian English, from what the paramedic sees and hears. No names, places or details that could identify anyone. This is a draft: a physician will check every rule before anyone trains on it.`;

/** Asks Claude for a scenario draft, installs it as a DRAFT owned by the physician, and returns its id. */
export async function draftScenario(user: CurrentUser, callId: string) {
  assertAuthor(user);
  const call = await getCall(user, callId);
  const { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } = env();
  if (!ANTHROPIC_API_KEY) throw new HttpError(503, "Drafting needs ANTHROPIC_API_KEY, and it isn't set.");
  if (await limited(`calls-draft:${user.id}`, 10, 60 * 60 * 1000)) {
    throw new HttpError(429, "That's ten drafts this hour. Try again later.");
  }

  let response;
  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    // Streamed: a draft can run long, and the SDK refuses large non-streaming requests.
    const stream = client.beta.messages.stream({
      model: ANTHROPIC_MODEL,
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "medium", format: betaZodOutputFormat(draftSchema) },
      messages: [
        {
          role: "user",
          content: `<call protocol="${call.protocol}" source="${call.source}">\n${transcript(call.turns)}\n</call>`,
        },
      ],
    });
    response = await stream.finalMessage();
  } catch (error) {
    console.error("[calls] draft failed", callId, error);
    throw new HttpError(
      502,
      error instanceof Anthropic.RateLimitError ? "Claude is busy. Try again in a minute." : "The draft couldn't be written. Try again.",
    );
  }
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new HttpError(502, "The draft couldn't be written for this call.");
  }

  const slug = `emsdialog-${call.sourceKey.replace(/\W+/g, "-")}-${Date.now().toString(36)}`.toLowerCase().slice(0, 80);
  const { def, fixes } = toScenarioDef(
    response.parsed_output,
    slug,
    `Drafted by Claude from ${call.source} ${call.sourceKey} (${EMSDIALOG.licence}, internal test). Check against the Ontario ALS PCS.`,
  );
  if (def.states.length < 2 || def.actions.length < 3) throw new HttpError(502, "The draft was too thin to use. Try again.");

  const scenario = await db.$transaction((tx) => installScenario(tx, def, { authorId: user.id, status: "DRAFT" }), { timeout: 30_000 });
  const notes = [...fixes, ...response.parsed_output.reviewerNotes.map((n) => n.slice(0, 500))].slice(0, 30);
  await db.dialogueCall.update({ where: { id: callId }, data: { draftScenarioId: scenario.id, draftNotes: notes } });

  const usage = {
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
    cacheRead: response.usage.cache_read_input_tokens ?? 0,
    cacheWrite: response.usage.cache_creation_input_tokens ?? 0,
  };
  await audit(user, "scenario.create", { type: "Scenario", id: scenario.id }, {
    title: scenario.title,
    from: `${call.source} ${call.sourceKey}`,
    model: response.model,
    costMicroUsd: costMicroUsd(response.model, usage),
  });

  const stateIds = await db.scenarioState.findMany({ where: { scenarioId: scenario.id } });
  const rules = await db.scenarioRule.findMany({ where: { scenarioId: scenario.id } });
  const problems = publishProblems({ states: stateIds, actions: def.actions, rules });
  return { scenarioId: scenario.id, notes, problems };
}
