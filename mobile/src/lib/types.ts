// Shapes returned by /api/v1. The server is the source of truth: see
// src/server/sessions/service.ts and src/server/scenarios/service.ts.

export type Role = "PARAMEDIC" | "INSTRUCTOR" | "PHYSICIAN" | "ADMIN";
export type Outcome = "CORRECT" | "ACCEPTABLE" | "SUBOPTIMAL" | "HARMFUL" | "CRITICAL";

export type Me = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  level: string | null;
  yearsExperience: number | null;
  preferredName: string | null;
  pronouns: string | null;
  station: string | null;
  bio: string | null;
  certifications: string[];
  notifyAssessments: boolean;
  avatarVersion: string | null;
  memberSince: string;
  organizationId: string | null;
  organizationName: string | null;
};

export type ProfilePatch = Partial<
  Pick<Me, "firstName" | "lastName" | "preferredName" | "pronouns" | "station" | "bio" | "certifications" | "notifyAssessments" | "yearsExperience" | "level">
>;

export type ScenarioSummary = {
  id: string;
  title: string;
  summary: string;
  category: string;
  difficulty: string;
  timeLimitSec: number;
  publishedAt: string | null;
};

export type Vitals = {
  hr?: number;
  sbp?: number;
  dbp?: number;
  rr?: number;
  spo2?: number;
  etco2?: number;
  gcs?: number;
  temp?: number;
  glucose?: number;
  rhythm?: string;
  skin?: string;
};

export type Action = { id: string; category: string; label: string; detail: string | null };

export type Runtime = {
  id: string;
  status: "IN_PROGRESS" | "COMPLETED" | "TIMED_OUT" | "ABANDONED";
  startedAt: string;
  serverNow: string;
  scenario: { id: string; title: string; dispatch: string; category: string; timeLimitSec: number; actions: Action[] };
  state: { id: string; title: string; narrative: string; vitals: Vitals; isTerminal: boolean } | null;
  decisions: { id: string; actionId: string; outcome: Outcome; elapsedMs: number }[];
};

export type Verdict = { outcome: Outcome; late: boolean; repeated: boolean; ended: boolean };

export type AiContent = {
  summary: string;
  keyMoment: { decision: string; why: string };
  strengths: string[];
  improvements: { point: string; reference: string | null }[];
  practiseNext: string;
};

export type Review = {
  id: string;
  status: Runtime["status"];
  scenario: { id: string; title: string; category: string; protocolSource: string | null };
  startedAt: string;
  durationSec: number;
  score: number;
  maxScore: number;
  percent: number;
  grade: "Excellent" | "Proficient" | "Developing" | "Needs review";
  endState: { title: string; debrief: string | null } | null;
  decisions: {
    id: string;
    elapsedMs: number;
    outcome: Outcome;
    points: number;
    action: string;
    detail: string | null;
    state: string;
    rationale: string;
    teaching: { title: string; body: string; reference: string | null } | null;
  }[];
  missed: { action: string; rationale: string }[];
  ai: { status: "PENDING" | "READY" | "FAILED" | "SKIPPED"; content: AiContent | null; review: string } | null;
};

export type SessionSummary = {
  id: string;
  status: Runtime["status"];
  startedAt: string;
  percent: number;
  scenario: { id: string; title: string; category: string };
};

// Research: src/server/research/*.

export type PaperRef = { source: string; extId: string };

export type PaperSummary = PaperRef & {
  title: string;
  authors: string | null;
  journal: string | null;
  year: number | null;
  doi: string | null;
  openAccess: boolean;
  citedBy: number;
  pubType: string | null;
  saved: boolean;
};

export type PaperSearch = { total: number; results: PaperSummary[]; nextCursor: string | null };

export type Brief = {
  bottomLine: string;
  design: string;
  evidence: string;
  population: string;
  findings: string[];
  limitations: string[];
  onTheRoad: string;
  terms: { term: string; meaning: string }[];
};

export type PaperBrief = { basedOn: "abstract" | "full text"; content: Brief; createdAt: string };

export type PaperDetail = Omit<PaperSummary, "saved"> & {
  abstract: string | null;
  keywords: string[];
  pubTypes: string[];
  url: string;
  saved: boolean;
  brief: PaperBrief | null;
};

export type SavedPaper = PaperRef & { title: string; journal: string | null; year: number | null; savedAt: string };
