import { describe, expect, it } from "vitest";

import { publishProblems } from "../publish-check";

import { LIBRARY } from ".";

describe("scenario library", () => {
  it("has unique slugs", () => {
    expect(new Set(LIBRARY.map((d) => d.slug)).size).toBe(LIBRARY.length);
  });

  for (const def of LIBRARY) {
    describe(def.slug, () => {
      const states = new Set(def.states.map((s) => s.key));
      const actions = new Set(def.actions.map((a) => a.key));
      const feedback = new Set(def.feedback.map((f) => f.key));

      it("only refers to states, actions and notes it defines", () => {
        for (const r of def.rules) {
          if (r.from) expect(states, `from ${r.from}`).toContain(r.from);
          if (r.to) expect(states, `to ${r.to}`).toContain(r.to);
          expect(actions, `action ${r.action}`).toContain(r.action);
          if (r.feedback) expect(feedback, `feedback ${r.feedback}`).toContain(r.feedback);
        }
      });

      it("passes the publish check", () => {
        const problems = publishProblems({
          states: def.states.map((s) => ({ id: s.key, title: s.title, isStart: !!s.isStart, isTerminal: !!s.isTerminal })),
          actions: def.actions,
          rules: def.rules.map((r) => ({ fromStateId: r.from, toStateId: r.to ?? null, required: !!r.required, points: r.points, outcome: r.outcome })),
        });
        expect(problems).toEqual([]);
      });

      it("gives every end state a debrief", () => {
        for (const s of def.states.filter((x) => x.isTerminal)) expect(s.debrief, s.key).toBeTruthy();
      });
    });
  }
});
