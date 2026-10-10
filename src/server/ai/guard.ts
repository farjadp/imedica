// Checks generated explanations before they're stored. Pure, so it's testable.

const PII_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: "email", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i },
  { name: "phone", pattern: /\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/ },
  { name: "health card", pattern: /\b\d{4}[- ]?\d{3}[- ]?\d{3}(?:[- ]?[A-Z]{2})?\b/ },
  { name: "postal code", pattern: /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d\b/i },
];

// The model explains verdicts; it must never claim to have changed one.
const SCORE_CLAIMS = /\b(I (?:have )?(?:changed|adjusted|raised|lowered|overrode)|your (?:new|updated) score)\b/i;

export function findProblems(text: string): string[] {
  const problems = PII_PATTERNS.filter((p) => p.pattern.test(text)).map((p) => `looks like a ${p.name}`);
  if (SCORE_CLAIMS.test(text)) problems.push("claims to change the score");
  return problems;
}

export type ModelPrice = { input: number; output: number; cacheRead: number; cacheWrite: number };

// US dollars per million tokens (cached 2026-10-06). Unknown models fall back to Opus 5.5.
const PRICES: Record<string, ModelPrice> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
};

/** Cost in micro-dollars (1e-6 USD), so it fits an integer column. */
export function costMicroUsd(
  model: string,
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number },
): number {
  const p = PRICES[model] ?? PRICES["claude-opus-5-5"];
  return Math.round(
    usage.input * p.input + usage.output * p.output + usage.cacheRead * p.cacheRead + usage.cacheWrite * p.cacheWrite,
  );
}
