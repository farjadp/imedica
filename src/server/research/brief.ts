import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

import { costMicroUsd } from "../ai/guard";
import { HttpError } from "../auth/guards";
import { db } from "../db";
import { env } from "../env";

import { getFullText, getPaper, type PaperDetail } from "./europepmc";

// ============================================================================
// A plain-language reading of a published paper for paramedics: what was
// studied, what was found, how strong it is, and what it might mean on the
// road. It is a reading aid, never a protocol: practice follows the medical
// directives of the paramedic's base hospital.
// ============================================================================

export const briefSchema = z.object({
  bottomLine: z.string().describe("Two sentences: the question the paper asked and what it found, for a paramedic between calls."),
  design: z.string().describe("The study design in a few words, e.g. 'Retrospective cohort, 4 US EMS agencies'."),
  evidence: z
    .enum(["Systematic review", "Randomised trial", "Cohort or case-control", "Cross-sectional or registry", "Case report or series", "Simulation study", "Guideline or consensus", "Narrative review", "Other"])
    .describe("The closest evidence category."),
  population: z.string().describe("Who or what was studied, with the sample size if given."),
  findings: z.array(z.string()).min(1).max(5).describe("The main results, each one sentence, with the numbers the paper reports."),
  limitations: z.array(z.string()).max(4).describe("The limitations that most affect how far the result can be trusted or applied."),
  onTheRoad: z
    .string()
    .describe(
      "Two or three sentences on what this could mean for Canadian paramedic practice, hedged to the strength of the evidence. Never tell the reader to change practice; point them to their medical directives and base hospital.",
    ),
  terms: z
    .array(z.object({ term: z.string(), meaning: z.string() }))
    .max(4)
    .describe("Up to four technical terms or statistics from the paper a paramedic might not know, each explained in one sentence."),
});
export type Brief = z.infer<typeof briefSchema>;

const SYSTEM = `You read published medical research for Canadian paramedics (PCP, ACP and CCP) and explain it in plain Canadian English.

Work only from the paper text you are given. Report the paper's own numbers and claims faithfully; never add results, doses or outcomes that aren't in it. If the text is only an abstract, say less rather than guess at the methods. Judge the strength of the evidence honestly: small, single-centre, observational or simulation studies get clearly hedged conclusions.

Never advise a paramedic to change practice on the strength of one paper. Practice in Canada follows provincial patient care standards and base hospital medical directives; when a paper bears on practice, say what it suggests and that the directives decide.`;

function paperPrompt(paper: PaperDetail, body: string, basedOn: string) {
  return [
    "<paper>",
    `Title: ${paper.title}`,
    `Authors: ${paper.authors ?? "not given"}`,
    `Journal: ${paper.journal ?? "not given"} (${paper.year ?? "year not given"})`,
    `Publication types: ${paper.pubTypes.join(", ") || "not given"}`,
    `What follows is the ${basedOn}.`,
    "</paper>",
    "<text>",
    body,
    "</text>",
  ].join("\n");
}

export async function findBrief(source: string, extId: string) {
  const row = await db.paperBrief.findUnique({ where: { source_extId: { source, extId } } });
  return row ? { basedOn: row.basedOn, content: row.content as Brief, createdAt: row.createdAt } : null;
}

/** Returns the cached brief, or reads the paper and writes one. */
export async function getOrCreateBrief(source: string, extId: string) {
  const cached = await findBrief(source, extId);
  if (cached) return cached;

  const { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } = env();
  if (!ANTHROPIC_API_KEY) throw new HttpError(503, "Paper summaries aren't switched on yet.");

  const paper = await getPaper(source, extId);
  const full = await getFullText(paper);
  const basedOn = full ? "full text" : "abstract";
  const body = full ?? paper.abstract;
  if (!body) throw new HttpError(422, "This paper has no abstract or open full text to read.");

  let response;
  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    response = await client.beta.messages.parse({
      model: ANTHROPIC_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "low", format: betaZodOutputFormat(briefSchema) },
      messages: [{ role: "user", content: paperPrompt(paper, body, basedOn) }],
    });
  } catch (error) {
    console.error("[research] brief failed", source, extId, error);
    throw new HttpError(
      502,
      error instanceof Anthropic.RateLimitError ? "The summariser is busy. Try again in a minute." : "The summary couldn't be written. Try again.",
    );
  }
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new HttpError(502, "The summary couldn't be written for this paper.");
  }

  const usage = {
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
    cacheRead: response.usage.cache_read_input_tokens ?? 0,
    cacheWrite: response.usage.cache_creation_input_tokens ?? 0,
  };
  const row = await db.paperBrief.upsert({
    where: { source_extId: { source, extId } },
    create: {
      source,
      extId,
      basedOn,
      content: response.parsed_output,
      model: response.model,
      inputTokens: usage.input + usage.cacheWrite + usage.cacheRead,
      outputTokens: usage.output,
      costMicroUsd: costMicroUsd(response.model, usage),
    },
    update: {},
  });
  return { basedOn: row.basedOn, content: row.content as Brief, createdAt: row.createdAt };
}
