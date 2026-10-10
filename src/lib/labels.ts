// Human labels for enum values, shared across the app.

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

export const roleLabel: Record<string, string> = {
  PARAMEDIC: "Paramedic",
  INSTRUCTOR: "Instructor",
  PHYSICIAN: "Physician",
  ADMIN: "Imedica admin",
};

export const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const orgTypeLabel: Record<string, string> = {
  EMS_SERVICE: "Paramedic service",
  FIRE_SERVICE: "Fire service",
  HOSPITAL: "Hospital",
  COLLEGE: "College",
  LONG_TERM_CARE: "Long-term care",
  OTHER: "Other",
};

export function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
