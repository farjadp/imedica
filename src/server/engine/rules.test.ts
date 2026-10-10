import { describe, expect, it } from "vitest";

import { type EngineRule, evaluate, grade, matchRule, maxScore, missedRequired, scorePercent } from "./rules";

const rule = (overrides: Partial<EngineRule> & Pick<EngineRule, "id" | "actionId">): EngineRule => ({
  fromStateId: "s1",
  outcome: "CORRECT",
  points: 10,
  toStateId: null,
  withinSec: null,
  priority: 100,
  required: false,
  ...overrides,
});

const base = {
  stateId: "s1",
  secondsInState: 5,
  firedRuleIds: new Set<string>(),
  terminalStateIds: new Set<string>(["end"]),
};

describe("matchRule", () => {
  it("prefers a state-specific rule over an any-state rule", () => {
    const rules = [
      rule({ id: "any", actionId: "a", fromStateId: null, priority: 1 }),
      rule({ id: "specific", actionId: "a", priority: 500 }),
    ];
    expect(matchRule(rules, "s1", "a")?.id).toBe("specific");
  });

  it("uses priority to break ties", () => {
    const rules = [rule({ id: "late", actionId: "a", priority: 200 }), rule({ id: "early", actionId: "a", priority: 10 })];
    expect(matchRule(rules, "s1", "a")?.id).toBe("early");
  });

  it("ignores rules for other states", () => {
    expect(matchRule([rule({ id: "x", actionId: "a", fromStateId: "s2" })], "s1", "a")).toBeNull();
  });
});

describe("evaluate", () => {
  it("scores an unlisted action as suboptimal with no points and no transition", () => {
    const v = evaluate({ ...base, rules: [], actionId: "a" });
    expect(v).toMatchObject({ ruleId: null, outcome: "SUBOPTIMAL", points: 0, nextStateId: "s1", endsScenario: false });
  });

  it("applies the rule's outcome, points and transition", () => {
    const v = evaluate({ ...base, rules: [rule({ id: "r", actionId: "a", toStateId: "s2" })], actionId: "a" });
    expect(v).toMatchObject({ ruleId: "r", outcome: "CORRECT", points: 10, nextStateId: "s2" });
  });

  it("downgrades a correct action taken after its time window and halves the points", () => {
    const v = evaluate({
      ...base,
      secondsInState: 90,
      rules: [rule({ id: "r", actionId: "a", withinSec: 60, points: 9 })],
      actionId: "a",
    });
    expect(v).toMatchObject({ outcome: "SUBOPTIMAL", points: 4, late: true });
  });

  it("gives no credit for repeating a good action", () => {
    const v = evaluate({ ...base, firedRuleIds: new Set(["r"]), rules: [rule({ id: "r", actionId: "a" })], actionId: "a" });
    expect(v).toMatchObject({ outcome: "CORRECT", points: 0, repeated: true });
  });

  it("applies a penalty every time it's repeated", () => {
    const v = evaluate({
      ...base,
      firedRuleIds: new Set(["r"]),
      rules: [rule({ id: "r", actionId: "a", outcome: "HARMFUL", points: -5 })],
      actionId: "a",
    });
    expect(v.points).toBe(-5);
  });

  it("ends the scenario on a critical outcome", () => {
    const v = evaluate({ ...base, rules: [rule({ id: "r", actionId: "a", outcome: "CRITICAL", points: -20 })], actionId: "a" });
    expect(v.endsScenario).toBe(true);
  });

  it("ends the scenario when the transition reaches a terminal state", () => {
    const v = evaluate({ ...base, rules: [rule({ id: "r", actionId: "a", toStateId: "end" })], actionId: "a" });
    expect(v.endsScenario).toBe(true);
  });
});

describe("scoring", () => {
  const rules = [
    rule({ id: "a", actionId: "a", required: true, points: 10 }),
    rule({ id: "b", actionId: "b", required: true, points: 20 }),
    rule({ id: "c", actionId: "c", required: false, points: 50 }),
    rule({ id: "d", actionId: "d", required: true, outcome: "HARMFUL", points: -10 }),
  ];

  it("counts only positive points on required steps toward the maximum", () => {
    expect(maxScore(rules)).toBe(30);
  });

  it("clamps the percentage between 0 and 100", () => {
    expect(scorePercent(45, 30)).toBe(100);
    expect(scorePercent(-5, 30)).toBe(0);
    expect(scorePercent(15, 30)).toBe(50);
    expect(scorePercent(5, 0)).toBe(0);
  });

  it("lists required steps that never fired", () => {
    expect(missedRequired(rules, new Set(["a"])).map((r) => r.id)).toEqual(["b", "d"]);
  });

  it("never rates a run with harmful actions above Developing", () => {
    expect(grade(95, 1)).toBe("Developing");
    expect(grade(40, 1)).toBe("Needs review");
    expect(grade(95, 0)).toBe("Excellent");
    expect(grade(80, 0)).toBe("Proficient");
  });
});
