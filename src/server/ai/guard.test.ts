import { describe, expect, it } from "vitest";

import { costMicroUsd, findProblems } from "./guard";

describe("findProblems", () => {
  it("passes ordinary clinical feedback", () => {
    expect(findProblems("Giving ASA 162 mg early was correct. Nitro with a systolic of 94 was not.")).toEqual([]);
  });

  it.each([
    ["contact me at medic@example.ca", "looks like a email"],
    ["call 416-555-0199 for review", "looks like a phone"],
    ["the patient lived at M5V 2T6", "looks like a postal code"],
  ])("flags %s", (text, problem) => {
    expect(findProblems(text)).toContain(problem);
  });

  it("flags the model claiming to change a score", () => {
    expect(findProblems("I adjusted your score to reflect the late ECG.")).toContain("claims to change the score");
  });
});

describe("costMicroUsd", () => {
  it("prices Opus 5.5 at $4 in / $20 out per million tokens", () => {
    expect(costMicroUsd("claude-opus-5-5", { input: 1000, output: 500, cacheRead: 0, cacheWrite: 0 })).toBe(14000);
  });

  it("falls back to Opus 5.5 pricing for unknown models", () => {
    expect(costMicroUsd("future-model", { input: 1_000_000, output: 0, cacheRead: 0, cacheWrite: 0 })).toBe(4_000_000);
  });
});
