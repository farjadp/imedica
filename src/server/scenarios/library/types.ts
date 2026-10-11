// A scenario as authored in code: states, actions and rules refer to each
// other by key, and install.ts turns the keys into ids.
import type { ActionCategory, Outcome, ScenarioCategory } from "../../../generated/prisma/enums";

export type StateDef = { key: string; title: string; narrative: string; vitals: Record<string, unknown>; isStart?: boolean; isTerminal?: boolean; debrief?: string };
export type ActionDef = { key: string; category: ActionCategory; label: string; detail?: string };
export type RuleDef = {
  from: string | null;
  action: string;
  outcome: Outcome;
  points: number;
  to?: string;
  within?: number;
  rationale: string;
  feedback?: string;
  required?: boolean;
  priority?: number;
};
export type ScenarioDef = {
  slug: string;
  title: string;
  summary: string;
  dispatch: string;
  category: ScenarioCategory;
  difficulty: "FOUNDATIONAL" | "INTERMEDIATE" | "ADVANCED";
  timeLimitSec: number;
  learningGoals: string[];
  protocolSource: string;
  status: "DRAFT" | "IN_REVIEW" | "PUBLISHED";
  states: StateDef[];
  actions: ActionDef[];
  feedback: { key: string; title: string; body: string; reference?: string }[];
  rules: RuleDef[];
};
