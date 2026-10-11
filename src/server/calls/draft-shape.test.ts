import { describe, expect, it } from "vitest";

import { publishProblems } from "../scenarios/publish-check";

import type { Draft } from "./draft-shape";
import { toScenarioDef } from "./draft-shape";
import { sampleDraft } from "./draft-fixture";
import { protocolName, syntheticFiles, toCallRow, transcript } from "./emsdialog";

describe("toScenarioDef", () => {
  it("makes a draft the installer can write and the publish check accepts", () => {
    const { def, fixes } = toScenarioDef(sampleDraft, "emsdialog-test", "Drafted from EMSDialog");
    expect(def).toMatchObject({ status: "DRAFT", timeLimitSec: 900, category: "CARDIAC" });
    expect(def.rules).toHaveLength(3);
    expect(fixes).toEqual(["Dropped 1 rule that pointed to a state or action that doesn't exist."]);

    const states = def.states.map((s) => ({ id: s.key, title: s.title, isStart: !!s.isStart, isTerminal: !!s.isTerminal }));
    const rules = def.rules.map((r) => ({ fromStateId: r.from, toStateId: r.to ?? null, required: !!r.required, points: r.points, outcome: r.outcome }));
    expect(publishProblems({ states, actions: def.actions, rules })).toEqual([]);
  });

  it("keeps only real vitals and the rhythm", () => {
    const { def } = toScenarioDef(sampleDraft, "s", "p");
    expect(def.states[0].vitals).toEqual({ hr: 110, sbp: 92, dbp: 60, rr: 22, spo2: 94, gcs: 15, rhythm: "stemi", skin: "Pale" });
  });

  it("fixes a draft with no start, no end, duplicate keys and wild numbers", () => {
    const bad: Draft = {
      ...sampleDraft,
      timeLimitMinutes: 500,
      states: sampleDraft.states.map((s) => ({ ...s, key: "same", isStart: false, isTerminal: false })),
      rules: [{ ...sampleDraft.rules[0], from: null, points: 999, withinSeconds: 99999 }],
    };
    const { def, fixes } = toScenarioDef(bad, "s", "p");
    expect(def.states.map((s) => s.key)).toEqual(["same", "same_2"]);
    expect(def.states.map((s) => [s.isStart, s.isTerminal])).toEqual([
      [true, false],
      [false, true],
    ]);
    expect(def.timeLimitSec).toBe(3600);
    expect(def.rules[0]).toMatchObject({ points: 100, within: 3600 });
    expect(fixes).toContain("Set the first state as the only start state.");
    expect(fixes).toContain("Marked the last state as an end state.");
  });
});

describe("EMSDialog records", () => {
  it("names the protocol without its number", () => {
    expect(protocolName(["medical - chest pain - cardiac suspected (protocol 2 - 1)"])).toBe("Medical - chest pain - cardiac suspected");
    expect(protocolName(null)).toBe("Unknown");
  });

  it("reads a call's turns and skips a call too short to use", () => {
    const dialogue = ["Unit 3, respond.", "On our way.", "What happened?", "He collapsed."].map((utterance, i) => ({
      role: i % 2 ? "EMT" : "Dispatcher",
      utterance,
    }));
    const row = toCallRow({ protocol: "general - cardiac arrest (protocol 2 - 7)", dialogue }, "EMSDialog-real", "train-0");
    expect(row).toMatchObject({ protocol: "General - cardiac arrest", turnCount: 4 });
    expect(transcript(row!.turns).split("\n")[0]).toBe("Dispatcher: Unit 3, respond.");
    expect(toCallRow({ dialogue: dialogue.slice(0, 2) }, "x", "y")).toBeNull();
  });

  it("lists only the numbered synthetic files", () => {
    const tree = [
      { type: "file", path: "EMSDialog-synthetic/000001.json" },
      { type: "file", path: "EMSDialog-synthetic/.DS_Store" },
      { type: "directory", path: "EMSDialog-synthetic/x" },
    ];
    expect(syntheticFiles(tree)).toEqual(["000001.json"]);
  });
});
