import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

import { db } from "../db";
import { env } from "../env";
import { costMicroUsd, findProblems } from "./guard";

// ============================================================================
// AI explanation of a finished run. The rule engine has already decided every
// verdict and the score; Claude only explains them. Nothing that identifies
// the paramedic is sent: the prompt is built from content and decisions only.
// ============================================================================

export const explanationSchema = z.object({
  summary: z.string().describe("Two or three sentences on how the run went overall, addressed to the paramedic."),
  keyMoment: z.object({
    decision: z.string().describe("The single decision that most shaped the outcome, as it appears in the log."),
    why: z.string().describe("Why it mattered clinically, in one or two sentences."),
  }),
  strengths: z.array(z.string()).max(3).describe("Up to three things done well, each one sentence."),
  improvements: z
    .array(z.object({ point: z.string(), reference: z.string().nullable() }))
    .max(3)
    .describe("Up to three concrete things to do differently, each with the protocol reference if one was given."),
  practiseNext: z.string().describe("One sentence suggesting what to practise next."),
});
export type Explanation = z.infer<typeof explanationSchema>;

const SYSTEM = `You write debriefs for Canadian paramedics who have just finished a simulated emergency call in a training platform.

A deterministic rule engine, written by emergency physicians, has already scored every decision. Its verdicts and the physicians' rationales are final. Your job is to explain them clearly and kindly, as a senior paramedic or physician would in a debrief, so the learner understands why and remembers it next time.

Ground every clinical statement in the scenario, the vitals, the rationales and the references you are given. If something isn't covered by them, leave it out rather than adding outside clinical claims. Never contradict a verdict, never suggest a different score, and never invent drug doses. Write in plain Canadian English, second person, without headings or markdown.`;

type RunForPrompt = Awaited<ReturnType<typeof loadRun>>;

async function loadRun(sessionId: string) {
  return db.trainingSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      scenario: {
        include: {
          states: true,
          actions: true,
          rules: { where: { required: true }, include: { action: true } },
          feedback: true,
        },
      },
      decisions: { orderBy: { elapsedMs: "asc" } },
    },
  });
}

function clock(ms: number) {
  return `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
}

function buildPrompt(run: RunForPrompt, firedRationale: string[]): string {
  const s = run.scenario;
  const stateById = new Map(s.states.map((x) => [x.id, x]));
  const actionById = new Map(s.actions.map((x) => [x.id, x]));
  const fired = new Set(run.decisions.map((d) => d.ruleId).filter(Boolean));

  const log = run.decisions.map((d) => {
    const a = actionById.get(d.actionId);
    const where = stateById.get(d.stateId)?.title ?? "?";
    return `- ${clock(d.elapsedMs)} [${where}] ${a?.label ?? "?"}${a?.detail ? ` (${a.detail})` : ""} → ${d.outcome}`;
  });
  const missed = s.rules.filter((r) => !fired.has(r.id)).map((r) => `- ${r.action.label}: ${r.rationale}`);
  const states = [...s.states]
    .sort((a, b) => a.order - b.order)
    .map((st) => `- ${st.title}: ${st.narrative} Vitals: ${JSON.stringify(st.vitals)}`);

  return [
    "<scenario>",
    `Title: ${s.title}`,
    `Dispatch: ${s.dispatch}`,
    ...(s.protocolSource ? [`Protocol source: ${s.protocolSource}`] : []),
    `Learning goals: ${s.learningGoals.join("; ") || "not stated"}`,
    "</scenario>",
    "<states>",
    ...states,
    "</states>",
    "<physician_rules_that_fired>",
    ...firedRationale,
    "</physician_rules_that_fired>",
    "<decision_log>",
    ...log,
    "</decision_log>",
    "<required_steps_missed>",
    ...(missed.length ? missed : ["- none"]),
    "</required_steps_missed>",
    `Final status: ${run.status}. Score ${Math.max(0, run.score)} of ${run.maxScore}.`,
  ].join("\n");
}

export async function generateExplanation(sessionId: string): Promise<void> {
  const { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } = env();

  if (!ANTHROPIC_API_KEY) {
    await db.aiFeedback.update({ where: { sessionId }, data: { status: "SKIPPED" } });
    return;
  }

  try {
    const run = await loadRun(sessionId);
    const fired = await db.scenarioRule.findMany({
      where: { id: { in: run.decisions.map((d) => d.ruleId).filter((v): v is string => Boolean(v)) } },
      include: { action: true, feedback: true },
    });
    const rationale = fired.map(
      (r) =>
        `- ${r.action.label} → ${r.outcome}: ${r.rationale}${r.feedback ? ` | Teaching note "${r.feedback.title}": ${r.feedback.body}${r.feedback.reference ? ` (${r.feedback.reference})` : ""}` : ""}`,
    );
    const prompt = buildPrompt(run, rationale);

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const response = await client.beta.messages.parse({
      model: ANTHROPIC_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "medium", format: betaZodOutputFormat(explanationSchema) },
      messages: [{ role: "user", content: prompt }],
    });

    const usage = {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      cacheRead: response.usage.cache_read_input_tokens ?? 0,
      cacheWrite: response.usage.cache_creation_input_tokens ?? 0,
    };
    const accounting = {
      model: response.model,
      inputTokens: usage.input + usage.cacheWrite,
      outputTokens: usage.output,
      cacheReadTokens: usage.cacheRead,
      costMicroUsd: costMicroUsd(response.model, usage),
    };

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      await db.aiFeedback.update({
        where: { sessionId },
        data: { status: "FAILED", error: `No explanation (${response.stop_reason ?? "unparsed"})`, ...accounting },
      });
      return;
    }

    const problems = findProblems(JSON.stringify(response.parsed_output));
    await db.aiFeedback.update({
      where: { sessionId },
      data: problems.length
        ? { status: "FAILED", error: `Withheld: ${problems.join(", ")}`, review: "FLAGGED", ...accounting }
        : { status: "READY", content: response.parsed_output, error: null, ...accounting },
    });
  } catch (error) {
    const message =
      error instanceof Anthropic.RateLimitError
        ? "Rate limited by the AI provider."
        : error instanceof Anthropic.AuthenticationError
          ? "The AI provider rejected the API key."
          : error instanceof Anthropic.APIError
            ? `AI provider error ${error.status}.`
            : "Unexpected error while generating the explanation.";
    console.error("[ai] explanation failed", sessionId, error);
    await db.aiFeedback.update({ where: { sessionId }, data: { status: "FAILED", error: message } });
  }
}
