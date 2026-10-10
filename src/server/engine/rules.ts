// ============================================================================
// Deterministic scenario grader. Pure functions only: no I/O, no clock.
//
// The score is decided here and only here. The AI layer explains these
// verdicts afterwards; it never changes them.
// ============================================================================

export type Outcome = "CORRECT" | "ACCEPTABLE" | "SUBOPTIMAL" | "HARMFUL" | "CRITICAL";

export type EngineRule = {
  id: string;
  fromStateId: string | null;
  actionId: string;
  outcome: Outcome;
  points: number;
  toStateId: string | null;
  withinSec: number | null;
  priority: number;
  required: boolean;
};

export type Verdict = {
  ruleId: string | null;
  outcome: Outcome;
  points: number;
  nextStateId: string;
  late: boolean;
  repeated: boolean;
  endsScenario: boolean;
};

/** Rules for this exact state beat "any state" rules; then lower priority wins. */
export function matchRule(rules: EngineRule[], stateId: string, actionId: string): EngineRule | null {
  const candidates = rules.filter(
    (r) => r.actionId === actionId && (r.fromStateId === stateId || r.fromStateId === null),
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const specificity = Number(b.fromStateId !== null) - Number(a.fromStateId !== null);
    return specificity !== 0 ? specificity : a.priority - b.priority;
  });
  return candidates[0];
}

export function evaluate(input: {
  rules: EngineRule[];
  stateId: string;
  actionId: string;
  secondsInState: number;
  firedRuleIds: ReadonlySet<string>;
  terminalStateIds: ReadonlySet<string>;
}): Verdict {
  const rule = matchRule(input.rules, input.stateId, input.actionId);

  if (!rule) {
    return {
      ruleId: null,
      outcome: "SUBOPTIMAL",
      points: 0,
      nextStateId: input.stateId,
      late: false,
      repeated: false,
      endsScenario: false,
    };
  }

  const positive = rule.outcome === "CORRECT" || rule.outcome === "ACCEPTABLE";
  const late = positive && rule.withinSec !== null && input.secondsInState > rule.withinSec;
  const repeated = input.firedRuleIds.has(rule.id);

  const outcome: Outcome = late ? "SUBOPTIMAL" : rule.outcome;
  let points = rule.points;
  if (late) points = Math.floor(points / 2);
  // Credit is earned once; repeating a good action doesn't farm points.
  // Penalties apply every time.
  if (repeated && points > 0) points = 0;

  const nextStateId = rule.toStateId ?? input.stateId;
  const endsScenario = rule.outcome === "CRITICAL" || input.terminalStateIds.has(nextStateId);

  return { ruleId: rule.id, outcome, points, nextStateId, late, repeated, endsScenario };
}

/** The maximum score is the sum of the points on required steps. */
export function maxScore(rules: EngineRule[]): number {
  return rules.filter((r) => r.required && r.points > 0).reduce((sum, r) => sum + r.points, 0);
}

export function scorePercent(score: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((score / max) * 100)));
}

export function missedRequired(rules: EngineRule[], firedRuleIds: ReadonlySet<string>): EngineRule[] {
  return rules.filter((r) => r.required && !firedRuleIds.has(r.id));
}

export type Grade = "Excellent" | "Proficient" | "Developing" | "Needs review";

export function grade(percent: number, harmful: number): Grade {
  if (harmful > 0) return percent >= 70 ? "Developing" : "Needs review";
  if (percent >= 90) return "Excellent";
  if (percent >= 75) return "Proficient";
  if (percent >= 50) return "Developing";
  return "Needs review";
}
