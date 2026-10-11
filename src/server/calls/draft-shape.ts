// What Claude returns when it drafts a scenario from a call, and how that
// becomes a ScenarioDef the installer can write. Pure, so it's testable.

import { z } from "zod";

import { RHYTHMS } from "@/components/clinical/ecg";
import { ACTION_CATEGORIES, CATEGORIES, DIFFICULTIES, OUTCOMES } from "@/lib/validators/scenario";

import type { ScenarioDef } from "../scenarios/library/types";

const vital = z.number().nullable();

export const draftSchema = z.object({
  title: z.string().describe("Scenario title, under 100 characters, e.g. 'Witnessed arrest in a hockey arena'."),
  summary: z.string().describe("One or two sentences learners see in the library."),
  dispatch: z.string().describe("The call exactly as dispatch would give it: priority, age, sex, complaint, who called."),
  category: z.enum(CATEGORIES),
  difficulty: z.enum(DIFFICULTIES),
  timeLimitMinutes: z.number().int().describe("Between 5 and 30."),
  learningGoals: z.array(z.string()).describe("Two to five decisions the scenario trains, each under 120 characters."),
  states: z
    .array(
      z.object({
        key: z.string().describe("Short lowercase id, e.g. 'arrival', 'after_epi'."),
        title: z.string(),
        narrative: z.string().describe("What the paramedic sees and hears in this moment, 2 to 4 sentences, present tense."),
        vitals: z.object({
          hr: vital,
          sbp: vital,
          dbp: vital,
          rr: vital,
          spo2: vital,
          etco2: vital,
          gcs: vital,
          glucose: vital.describe("mmol/L"),
          temp: vital.describe("°C"),
          rhythm: z.enum(RHYTHMS),
          skin: z.string().nullable(),
        }),
        isStart: z.boolean(),
        isTerminal: z.boolean(),
        debrief: z.string().nullable().describe("For end states only: what this ending means, for the debrief."),
      }),
    )
    .describe("Three to eight moments in the call. Exactly one start state; at least one end state, including one for a good outcome."),
  actions: z
    .array(
      z.object({
        key: z.string(),
        category: z.enum(ACTION_CATEGORIES),
        label: z.string().describe("What the paramedic does, under 80 characters, e.g. 'Acetylsalicylic acid'."),
        detail: z.string().nullable().describe("Dose or detail, e.g. '162 mg chewed'."),
      }),
    )
    .describe("Six to fourteen choices on the action menu, including some plausible wrong ones."),
  rules: z
    .array(
      z.object({
        from: z.string().nullable().describe("State key this rule applies in, or null for any state."),
        action: z.string().describe("Action key."),
        outcome: z.enum(OUTCOMES),
        points: z.number().int().describe("-40 to 30. Positive for good care, negative for harm."),
        to: z.string().nullable().describe("State key the patient moves to, or null to stay."),
        withinSeconds: z.number().int().nullable().describe("Only for time-critical steps, e.g. 600 for a 12-lead in ten minutes."),
        rationale: z.string().describe("Why, in one or two sentences a paramedic would accept, citing the standard where it matters."),
        required: z.boolean().describe("True for the steps that must happen for a full score."),
      }),
    )
    .describe("How each action is scored in each state. Every end state must be reachable from the start."),
  reviewerNotes: z
    .array(z.string())
    .describe(
      "What the reviewing physician must check: anything you assumed because the transcript didn't say it, and anywhere US practice in the call differs from the Ontario ALS Patient Care Standards.",
    ),
});
export type Draft = z.infer<typeof draftSchema>;

const cut = (s: string | null | undefined, max: number) => (s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n)));
const slugKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "x";

/**
 * A ScenarioDef from the model's draft. Repairs what a model can get wrong:
 * duplicate or dangling keys, no start or end state, values outside the
 * editor's limits. Returns the problems it fixed so the physician sees them.
 */
export function toScenarioDef(draft: Draft, slug: string, protocolSource: string): { def: ScenarioDef; fixes: string[] } {
  const fixes: string[] = [];

  const states: ScenarioDef["states"] = [];
  const stateKeys = new Set<string>();
  for (const s of draft.states.slice(0, 10)) {
    let key = slugKey(s.key);
    while (stateKeys.has(key)) key += "_2";
    stateKeys.add(key);
    const vitals: Record<string, unknown> = { rhythm: s.vitals.rhythm };
    for (const k of ["hr", "sbp", "dbp", "rr", "spo2", "etco2", "gcs", "glucose", "temp"] as const) {
      const v = s.vitals[k];
      if (typeof v === "number" && Number.isFinite(v)) vitals[k] = v;
    }
    if (s.vitals.skin) vitals.skin = cut(s.vitals.skin, 80);
    states.push({
      key,
      title: cut(s.title, 120) || "Untitled moment",
      narrative: cut(s.narrative, 2000) || "Describe this moment.",
      vitals,
      isStart: s.isStart,
      isTerminal: s.isTerminal,
      debrief: s.isTerminal && s.debrief ? cut(s.debrief, 2000) : undefined,
    });
  }
  // Key renames above are by position, so map the model's keys to ours.
  const stateKey = new Map(draft.states.slice(0, 10).map((s, i) => [s.key, states[i].key]));

  const starts = states.filter((s) => s.isStart);
  if (starts.length !== 1 && states.length) {
    states.forEach((s, i) => (s.isStart = i === 0));
    fixes.push("Set the first state as the only start state.");
  }
  if (!states.some((s) => s.isTerminal) && states.length > 1) {
    states[states.length - 1].isTerminal = true;
    fixes.push("Marked the last state as an end state.");
  }

  const actions: ScenarioDef["actions"] = [];
  const actionKey = new Map<string, string>();
  for (const a of draft.actions.slice(0, 20)) {
    let key = slugKey(a.key);
    while ([...actionKey.values()].includes(key)) key += "_2";
    actionKey.set(a.key, key);
    actions.push({ key, category: a.category, label: cut(a.label, 120) || "Action", detail: a.detail ? cut(a.detail, 200) : undefined });
  }

  const rules: ScenarioDef["rules"] = [];
  let dropped = 0;
  for (const r of draft.rules.slice(0, 60)) {
    const action = actionKey.get(r.action);
    const from = r.from === null ? null : stateKey.get(r.from);
    const to = r.to === null ? undefined : stateKey.get(r.to);
    if (!action || from === undefined || (r.to !== null && to === undefined)) {
      dropped += 1;
      continue;
    }
    rules.push({
      from,
      action,
      outcome: r.outcome,
      points: clamp(r.points, -100, 100),
      to,
      within: r.withinSeconds ? clamp(r.withinSeconds, 1, 3600) : undefined,
      rationale: cut(r.rationale, 500).padEnd(5, "."),
      required: r.required,
    });
  }
  if (dropped) fixes.push(`Dropped ${dropped} rule${dropped === 1 ? "" : "s"} that pointed to a state or action that doesn't exist.`);

  return {
    def: {
      slug,
      title: cut(draft.title, 120).padEnd(3, "."),
      summary: cut(draft.summary, 400).padEnd(10, "."),
      dispatch: cut(draft.dispatch, 1000).padEnd(10, "."),
      category: draft.category,
      difficulty: draft.difficulty,
      timeLimitSec: clamp(draft.timeLimitMinutes, 2, 60) * 60,
      learningGoals: draft.learningGoals.slice(0, 8).map((g) => cut(g, 200)).filter(Boolean),
      protocolSource: cut(protocolSource, 300),
      status: "DRAFT",
      states,
      actions,
      feedback: [],
      rules,
    },
    fixes,
  };
}
