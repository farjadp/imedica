import { describe, expect, it } from "vitest";

import { publishProblems } from "./publish-check";

const states = [
  { id: "a", title: "Arrival", isStart: true, isTerminal: false },
  { id: "b", title: "Treated", isStart: false, isTerminal: false },
  { id: "c", title: "Handover", isStart: false, isTerminal: true },
];
const actions = [{}, {}, {}];
const good = [
  { fromStateId: "a", toStateId: "b", required: true, points: 10, outcome: "CORRECT" },
  { fromStateId: "b", toStateId: "c", required: false, points: 5, outcome: "CORRECT" },
];

describe("publishProblems", () => {
  it("passes a complete scenario", () => {
    expect(publishProblems({ states, actions, rules: good })).toEqual([]);
  });

  it("requires exactly one start state", () => {
    const two = states.map((s) => ({ ...s, isStart: s.id !== "c" }));
    expect(publishProblems({ states: two, actions, rules: good })).toContain("Mark exactly one state as the starting state.");
  });

  it("requires an end state, enough actions and a required rule", () => {
    const problems = publishProblems({
      states: states.map((s) => ({ ...s, isTerminal: false })),
      actions: [{}],
      rules: good.map((r) => ({ ...r, required: false })),
    });
    expect(problems).toEqual(
      expect.arrayContaining([
        "Add at least one end state.",
        "Add at least three actions to the menu.",
        "Mark at least one positive rule as required, so the scenario has a maximum score.",
      ]),
    );
  });

  it("flags states nothing leads to", () => {
    expect(publishProblems({ states, actions, rules: [good[0]] })).toEqual(['No rule leads to "Handover".']);
  });

  it("follows any-state rules when checking reachability", () => {
    const rules = [good[0], { fromStateId: null, toStateId: "c", required: false, points: 0, outcome: "CRITICAL" }];
    expect(publishProblems({ states, actions, rules })).toEqual([]);
  });
});
