// Turns EMS-MCQA records (Hugging Face: Xueren/EMS-MCQA) into question-bank
// rows. Pure, so it's testable without the network or a database.

import { createHash } from "node:crypto";

export const EMS_MCQA = {
  source: "EMS-MCQA",
  url: "https://huggingface.co/datasets/Xueren/EMS-MCQA/resolve/main/MCQA_open_final.json",
  page: "https://huggingface.co/datasets/Xueren/EMS-MCQA",
  // The dataset is labelled MIT, but its records come from Quizlet and exam-prep
  // sites, so that label doesn't clear the text for customers.
  licence: "MIT label; text collected from third-party quiz sites",
} as const;

export type BankRow = {
  source: string;
  sourceKey: string;
  origin: string | null;
  levels: string[];
  categories: string[];
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
};

type RawRecord = {
  question?: unknown;
  choices?: unknown;
  answer?: unknown;
  explanation?: unknown;
  link?: unknown;
  level?: unknown;
  category?: unknown;
};

const LETTERS = "abcdef";
const CHOICE = /^([a-f])\.\s+([\s\S]+)$/;

/** The dataset lowercases everything and marks blanks with zero-width spaces. */
export function tidy(text: string): string {
  const t = text
    .replace(/[​‌‍﻿]+/g, "_____")
    .replace(/\s+/g, " ")
    .trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function strings(value: unknown): string[] {
  const list = Array.isArray(value) ? value : value == null ? [] : [value];
  return list.filter((v): v is string => typeof v === "string" && v.trim() !== "" && v !== "NA").map((v) => v.trim());
}

/** One record, or null when it can't become a single-answer question our quiz can show. */
export function toBankRow(record: RawRecord): BankRow | null {
  if (typeof record.question !== "string" || !Array.isArray(record.choices) || typeof record.answer !== "string") {
    return null;
  }
  const options: string[] = [];
  for (const [i, raw] of record.choices.entries()) {
    const m = typeof raw === "string" ? CHOICE.exec(raw.trim()) : null;
    if (!m || m[1] !== LETTERS[i]) return null; // letters must run a, b, c… in order
    options.push(tidy(m[2]));
  }
  const correctIndex = LETTERS.indexOf(record.answer.trim());
  const stem = tidy(record.question);
  if (options.length < 2 || correctIndex < 0 || correctIndex >= options.length) return null;
  // The same limits the assessment editor enforces, so any row can be copied in.
  if (stem.length < 5 || stem.length > 600 || options.some((o) => o.length > 300)) return null;

  const explanation = typeof record.explanation === "string" && record.explanation.trim() ? tidy(record.explanation) : null;
  return {
    source: EMS_MCQA.source,
    sourceKey: createHash("sha256").update(JSON.stringify([stem, options])).digest("hex").slice(0, 32),
    origin: typeof record.link === "string" && /^https?:\/\//.test(record.link) ? record.link.slice(0, 300) : null,
    levels: strings(record.level),
    categories: strings(record.category),
    stem,
    options,
    correctIndex,
    explanation: explanation ? explanation.slice(0, 1000) : null,
  };
}

/** Every usable record once; duplicates (same stem and options) are dropped. */
export function parseEmsMcqa(records: unknown): { rows: BankRow[]; skipped: number } {
  if (!Array.isArray(records)) throw new Error("EMS-MCQA: expected a JSON array.");
  const seen = new Set<string>();
  const rows: BankRow[] = [];
  let skipped = 0;
  for (const r of records) {
    const row = r && typeof r === "object" ? toBankRow(r as RawRecord) : null;
    if (!row || seen.has(row.sourceKey)) {
      skipped += 1;
      continue;
    }
    seen.add(row.sourceKey);
    rows.push(row);
  }
  return { rows, skipped };
}
