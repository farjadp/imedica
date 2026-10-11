import { describe, expect, it } from "vitest";

import { MIN_QUESTIONS, assessmentProblems, quizScore } from "./score";

const q = (id: string, correctIndex: number) => ({ id, correctIndex, options: ["a", "b", "c", "d"] });

describe("quizScore", () => {
  const questions = [q("q1", 0), q("q2", 1), q("q3", 2), q("q4", 3)];

  it("is the percentage answered correctly", () => {
    expect(quizScore(questions, { q1: 0, q2: 1, q3: 0, q4: 0 })).toBe(50);
  });

  it("counts unanswered questions as wrong", () => {
    expect(quizScore(questions, { q1: 0 })).toBe(25);
  });

  it("ignores answers to questions that aren't in the quiz", () => {
    expect(quizScore(questions, { q1: 0, other: 1 })).toBe(25);
  });

  it("rounds to a whole percentage", () => {
    expect(quizScore(questions.slice(0, 3), { q1: 0 })).toBe(33);
  });

  it("is null when there are no questions", () => {
    expect(quizScore([], {})).toBeNull();
  });
});

describe("assessmentProblems", () => {
  const question = { stem: "Which?", options: ["a", "b"], correctIndex: 1, rationale: "Because." };
  const ready = {
    scenarioIds: ["s1"],
    publishedScenarioIds: new Set(["s1"]),
    questions: Array.from({ length: MIN_QUESTIONS }, () => question),
  };

  it("passes a complete assessment", () => {
    expect(assessmentProblems(ready)).toEqual([]);
  });

  it("needs at least one scenario, all of them published", () => {
    expect(assessmentProblems({ ...ready, scenarioIds: [] })).toContain("Add at least one published scenario.");
    expect(assessmentProblems({ ...ready, scenarioIds: ["s1", "gone"] })).toContain(
      "One of the scenarios is no longer published. Remove it or republish it.",
    );
  });

  it(`needs at least ${MIN_QUESTIONS} questions`, () => {
    expect(assessmentProblems({ ...ready, questions: [question] })).toContain(
      `Add at least ${MIN_QUESTIONS} quiz questions (1 so far).`,
    );
  });

  it("flags a question whose correct answer isn't one of its options", () => {
    const broken = { ...question, correctIndex: 5 };
    expect(assessmentProblems({ ...ready, questions: [...ready.questions, broken] })).toContain(
      `Question ${MIN_QUESTIONS + 1} needs a correct answer chosen from its options.`,
    );
  });
});
