import { describe, expect, it } from "vitest";

import { parseEmsMcqa, tidy, toBankRow } from "./ems-mcqa";

const record = {
  question: "how long will a 75- to 100-milligram bolus of lidocaine maintain adequate blood levels?",
  choices: ["a. 90 minutes", "b. 60 minutes", "c. 20 minutes", "d. 40 minutes"],
  answer: "c",
  explanation: "",
  link: "https://miningquiz.com/",
  level: ["paramedic"],
  category: ["pharmacology"],
};

describe("tidy", () => {
  it("restores the capital and turns zero-width blanks into a visible blank", () => {
    expect(tidy("damage to the ​ can  cause")).toBe("Damage to the _____ can cause");
  });
});

describe("toBankRow", () => {
  it("strips the letters and maps the answer to an index", () => {
    expect(toBankRow(record)).toMatchObject({
      source: "EMS-MCQA",
      stem: "How long will a 75- to 100-milligram bolus of lidocaine maintain adequate blood levels?",
      options: ["90 minutes", "60 minutes", "20 minutes", "40 minutes"],
      correctIndex: 2,
      explanation: null,
      origin: "https://miningquiz.com/",
      levels: ["paramedic"],
      categories: ["pharmacology"],
    });
  });

  it("skips questions with more than one answer", () => {
    expect(toBankRow({ ...record, answer: ["a", "b"] })).toBeNull();
  });

  it("skips choices that aren't lettered a, b, c… in order", () => {
    expect(toBankRow({ ...record, choices: ["a. one", "c. two"] })).toBeNull();
    expect(toBankRow({ ...record, choices: ["one", "two"] })).toBeNull();
  });

  it("skips an answer that isn't one of the choices", () => {
    expect(toBankRow({ ...record, answer: "e" })).toBeNull();
  });

  it("drops the NA level and a link that isn't a URL", () => {
    expect(toBankRow({ ...record, level: ["NA"], link: "javascript:alert(1)" })).toMatchObject({ levels: [], origin: null });
  });
});

describe("parseEmsMcqa", () => {
  it("keeps each question once", () => {
    const { rows, skipped } = parseEmsMcqa([record, { ...record, link: "https://quizlet.com" }, { nonsense: true }, null]);
    expect(rows).toHaveLength(1);
    expect(skipped).toBe(3);
  });

  it("refuses something that isn't a list", () => {
    expect(() => parseEmsMcqa({ data: [] })).toThrow(/JSON array/);
  });
});
