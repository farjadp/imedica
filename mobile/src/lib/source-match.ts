import type { ScenarioSource } from "./types";

/** "Advanced Life Support Patient Care Standards" → "ALSPCS". */
function acronym(title: string): string {
  return title
    .split(/[\s,:/-]+/)
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .join("");
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * The source a free-text teaching reference points at, if the scenario cites
 * it. Matches the section name first ("Cardiac Ischemia Medical Directive"),
 * then the document ("ALS PCS", or its full title). Null when nothing fits:
 * the reference then stays plain text rather than linking somewhere wrong.
 */
export function sourceForReference(reference: string, sources: ScenarioSource[] | undefined): ScenarioSource | null {
  if (!sources?.length || !reference.trim()) return null;
  const ref = squash(reference);
  const bySection = sources.find((s) => s.section && ref.includes(squash(s.section)));
  if (bySection) return bySection;
  // Capitals only, so "ALS PCS" reads as "ALSPCS" and ordinary words can't fake it.
  const refCaps = reference.replace(/[^A-Z]/g, "");
  return (
    sources.find((s) => ref.includes(squash(s.title))) ??
    sources.find((s) => {
      const a = acronym(s.title);
      return a.length >= 3 && refCaps.includes(a);
    }) ??
    null
  );
}
