// Human labels for enum values. Mirrors src/lib/labels.ts in the web app.

export const categoryLabel: Record<string, string> = {
  CARDIAC: "Cardiac",
  RESPIRATORY: "Respiratory",
  NEUROLOGICAL: "Neurological",
  TRAUMA: "Trauma",
  TOXICOLOGY: "Toxicology",
  ENVIRONMENTAL: "Environmental",
  OBSTETRIC: "Obstetric",
  PEDIATRIC: "Paediatric",
  ALLERGIC: "Allergic",
  METABOLIC: "Metabolic",
};

export const difficultyLabel: Record<string, string> = {
  FOUNDATIONAL: "Foundational",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const actionCategoryLabel: Record<string, string> = {
  ASSESSMENT: "Assessment",
  AIRWAY: "Airway",
  BREATHING: "Breathing",
  CIRCULATION: "Circulation",
  MEDICATION: "Medication",
  PROCEDURE: "Procedure",
  TRANSPORT: "Transport",
  COMMUNICATION: "Communication",
};

export function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function minutes(sec: number): string {
  return `${Math.max(1, Math.round(sec / 60))} min`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}
