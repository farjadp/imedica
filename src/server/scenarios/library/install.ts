// Writes a library scenario into the database. Used by the local seed and by
// the admin "Add library scenarios" button. No "server-only": the seed runs
// outside Next.
import type { PrismaClient } from "../../../generated/prisma/client";
import type { ScenarioStatus } from "../../../generated/prisma/enums";

import type { ScenarioDef } from "./types";

type Tx = Pick<PrismaClient, "scenario" | "scenarioState" | "scenarioAction" | "feedbackTemplate" | "scenarioRule">;

export async function installScenario(
  db: Tx,
  def: ScenarioDef,
  opts: { authorId: string; reviewerId?: string | null; status?: ScenarioStatus },
) {
  const status = opts.status ?? def.status;
  const published = status === "PUBLISHED";
  const scenario = await db.scenario.create({
    data: {
      slug: def.slug,
      title: def.title,
      summary: def.summary,
      dispatch: def.dispatch,
      category: def.category,
      difficulty: def.difficulty,
      timeLimitSec: def.timeLimitSec,
      learningGoals: def.learningGoals,
      protocolSource: def.protocolSource,
      status,
      authorId: opts.authorId,
      reviewerId: published ? (opts.reviewerId ?? null) : null,
      publishedAt: published ? new Date() : null,
    },
  });

  const stateIds = new Map<string, string>();
  for (const [order, s] of def.states.entries()) {
    const row = await db.scenarioState.create({
      data: {
        scenarioId: scenario.id,
        order,
        title: s.title,
        narrative: s.narrative,
        vitals: s.vitals as object,
        isStart: s.isStart ?? false,
        isTerminal: s.isTerminal ?? false,
        debrief: s.debrief ?? null,
      },
    });
    stateIds.set(s.key, row.id);
  }
  const actionIds = new Map<string, string>();
  for (const [order, a] of def.actions.entries()) {
    const row = await db.scenarioAction.create({
      data: { scenarioId: scenario.id, order, category: a.category, label: a.label, detail: a.detail ?? null },
    });
    actionIds.set(a.key, row.id);
  }
  const feedbackIds = new Map<string, string>();
  for (const f of def.feedback) {
    const row = await db.feedbackTemplate.create({
      data: { scenarioId: scenario.id, title: f.title, body: f.body, reference: f.reference ?? null },
    });
    feedbackIds.set(f.key, row.id);
  }
  for (const r of def.rules) {
    await db.scenarioRule.create({
      data: {
        scenarioId: scenario.id,
        fromStateId: r.from ? stateIds.get(r.from)! : null,
        actionId: actionIds.get(r.action)!,
        outcome: r.outcome,
        points: r.points,
        toStateId: r.to ? stateIds.get(r.to)! : null,
        withinSec: r.within ?? null,
        rationale: r.rationale,
        feedbackId: r.feedback ? feedbackIds.get(r.feedback)! : null,
        priority: r.priority ?? 100,
        required: r.required ?? false,
      },
    });
  }
  return scenario;
}
