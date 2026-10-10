import type { Vitals } from "@/lib/validators/scenario";

export type EState = {
  id: string;
  order: number;
  title: string;
  narrative: string;
  vitals: Vitals;
  isStart: boolean;
  isTerminal: boolean;
  debrief: string | null;
};
export type EAction = { id: string; category: string; label: string; detail: string | null; order: number };
export type ERule = {
  id: string;
  fromStateId: string | null;
  actionId: string;
  outcome: "CORRECT" | "ACCEPTABLE" | "SUBOPTIMAL" | "HARMFUL" | "CRITICAL";
  points: number;
  toStateId: string | null;
  withinSec: number | null;
  rationale: string;
  feedbackId: string | null;
  priority: number;
  required: boolean;
};
export type EFeedback = { id: string; title: string; body: string; reference: string | null };

export type EditorScenario = {
  id: string;
  title: string;
  summary: string;
  dispatch: string;
  category: string;
  difficulty: string;
  timeLimitSec: number;
  learningGoals: string[];
  protocolSource: string | null;
  status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
  authorId: string;
  reviewerId: string | null;
  states: EState[];
  actions: EAction[];
  rules: ERule[];
  feedback: EFeedback[];
  problems: string[];
};
