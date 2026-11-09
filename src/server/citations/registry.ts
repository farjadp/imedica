// ============================================================================
// Citation registry: the published sources behind Imedica's medical content,
// and which of them each library scenario is built on. Keyed by scenario slug,
// so no migration and no edit to the library files are needed.
//
// Shared by the API (scenario brief, debrief, /api/v1/sources), the public web
// Sources page and, through the API, the iOS app. Plain data: safe to import
// from server and client code alike.
//
// URLs verified 2026-11-08 (docs/app-store/2026-11-06-rejection-1.4.1.md §4).
// Re-check S1 when Ontario ALS PCS v5.5 comes into force.
// ============================================================================

export type SourceId = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8";
export type SourceKind = "guideline" | "data" | "literature";

export interface Source {
  id: SourceId;
  title: string;
  publisher: string;
  version: string | null;
  url: string;
  kind: SourceKind;
}

export const SOURCES: Record<SourceId, Source> = {
  S1: {
    id: "S1",
    title: "Advanced Life Support Patient Care Standards",
    publisher: "Ontario Ministry of Health",
    version: "v5.4 (in force 2 June 2025)",
    url: "https://www.ontario.ca/files/2025-04/moh-advanced-life-support-als-patient-care-standards-pcs-5.4-en-2025-04-23.pdf",
    kind: "guideline",
  },
  S2: {
    id: "S2",
    title: "Basic Life Support Patient Care Standards",
    publisher: "Ontario Ministry of Health",
    version: "v3.4 (in force 10 March 2023)",
    url: "https://www.ontario.ca/document/patient-care-documents-reference/basic-life-support-patient-care-standards",
    kind: "guideline",
  },
  S3: {
    id: "S3",
    title: "Patient care documents by reference",
    publisher: "Ontario Ministry of Health",
    version: null,
    url: "https://www.ontario.ca/document/patient-care-documents-reference",
    kind: "guideline",
  },
  S4: {
    id: "S4",
    title: "2025 Guidelines for CPR and ECC, Part 7: Adult Basic Life Support",
    publisher: "American Heart Association",
    version: "2025",
    url: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support",
    kind: "guideline",
  },
  S5: {
    id: "S5",
    title: "2025 Guidelines for CPR and ECC, Part 6: Pediatric Basic Life Support",
    publisher: "American Heart Association / American Academy of Pediatrics",
    version: "2025",
    url: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/pediatric-basic-life-support",
    kind: "guideline",
  },
  S6: {
    id: "S6",
    title: "Canadian Stroke Best Practice Recommendations: Acute Stroke Management",
    publisher: "Heart & Stroke Foundation of Canada",
    version: null,
    url: "https://www.strokebestpractices.ca/recommendations/acute-stroke-management",
    kind: "guideline",
  },
  S7: {
    id: "S7",
    title: "PTB-XL, a large publicly available electrocardiography dataset (CC BY 4.0)",
    publisher: "PhysioNet",
    version: "1.0.3",
    url: "https://physionet.org/content/ptb-xl/1.0.3/",
    kind: "data",
  },
  S8: {
    id: "S8",
    title: "Europe PMC (paper search in Research)",
    publisher: "EMBL-EBI",
    version: null,
    url: "https://europepmc.org/",
    kind: "literature",
  },
};

export interface ScenarioSourceRef {
  sourceId: SourceId;
  section: string | null;
}

/** Library scenario slug → the sources it is built on, most specific first. */
export const SCENARIO_SOURCES: Record<string, ScenarioSourceRef[]> = {
  "inferior-stemi-rv-involvement": [
    { sourceId: "S1", section: "Cardiac Ischemia Medical Directive" },
    { sourceId: "S2", section: "STEMI Hospital Bypass Protocol" },
  ],
  "anaphylaxis-wasp-sting": [{ sourceId: "S1", section: "Moderate to Severe Allergic Reaction Medical Directive" }],
  "hypoglycemia-altered-loc": [{ sourceId: "S1", section: "Hypoglycemia Medical Directive" }],
  "opioid-toxicity-respiratory-depression": [{ sourceId: "S1", section: "Opioid Toxicity Medical Directive" }],
  "paediatric-status-seizure": [{ sourceId: "S1", section: "Seizure Medical Directive" }],
  "severe-asthma-exacerbation": [{ sourceId: "S1", section: "Bronchoconstriction Medical Directive" }],
  "acute-stroke-evt-bypass": [
    { sourceId: "S2", section: "Acute Stroke Protocol" },
    { sourceId: "S6", section: null },
  ],
  "catastrophic-limb-hemorrhage": [{ sourceId: "S2", section: "Field Trauma Triage Standard" }],
  // BLS arrest scenarios (arrest.ts, not merged yet).
  "adult-bls-cardiac-arrest-vf": [{ sourceId: "S4", section: null }],
  "paediatric-bls-arrest-two-rescuers": [{ sourceId: "S5", section: null }],
};

/** A source as shown next to a scenario: the source plus the section it points at. */
export interface ScenarioSource {
  id: SourceId;
  title: string;
  publisher: string;
  version: string | null;
  section: string | null;
  url: string;
}

/** The sources for a scenario slug, resolved for display. Unknown slugs get an empty list. */
export function sourcesForSlug(slug: string): ScenarioSource[] {
  const refs = Object.hasOwn(SCENARIO_SOURCES, slug) ? SCENARIO_SOURCES[slug] : [];
  return refs.map(({ sourceId, section }) => {
    const { id, title, publisher, version, url } = SOURCES[sourceId];
    return { id, title, publisher, version, section, url };
  });
}

export const DISCLAIMER_URL = "https://www.imedica.tech/legal/disclaimer";
