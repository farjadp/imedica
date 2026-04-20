// ============================================================================
// File: packages/shared/src/types/index.ts
// Version: 1.0.0 — 2026-04-20
// Why: Single source of truth for all TypeScript types shared across web,
//      mobile, and backend. Keeps the API contract explicit and typed.
//      Does NOT import from Prisma — these are transport-layer types.
// Env / Identity: Shared package (web, mobile, backend)
// ============================================================================

// ─── Enums ──────────────────────────────────────────────────────────────────

export type UserRole = 'paramedic' | 'admin' | 'super_admin' | 'clinical_validator';

export type OrgType = 'paramedic_service' | 'training_program' | 'private';

export type OrgPlan = 'pilot' | 'standard' | 'enterprise';

export type ParamedicLevel = 'PCP' | 'ACP' | 'CCP' | 'student';

export type ExperienceBucket = '0-2_years' | '3-5_years' | '5-10_years' | '10+_years';

export type ServiceType = 'public_large' | 'public_small' | 'private' | 'training_program';

export type ScenarioCategory =
  | 'cardiac'
  | 'trauma'
  | 'neuro'
  | 'respiratory'
  | 'pediatric'
  | 'obstetric'
  | 'toxicology';

export type ScenarioDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ScenarioStatus = 'draft' | 'review' | 'published';

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export type DecisionType =
  | 'assessment'
  | 'medication'
  | 'procedure'
  | 'diagnosis'
  | 'transport';

export type RuleStatus = 'draft' | 'active' | 'deprecated';

export type AuditActorType = 'user' | 'system';

export type AuditResult = 'success' | 'failure';

// ─── Identity Store Types ────────────────────────────────────────────────────

/** Full user object — only ever used inside the identity boundary.
 *  NEVER send this to analytics or the LLM.
 */
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  organizationId: string | null;
  role: UserRole;
  emailVerified: boolean;
  mfaEnabled: boolean;
  consentAnalytics: boolean;
  consentAnalyticsDate: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  deletedAt: Date | null;
}

/** Safe user object returned to the client — no password_hash, no mfa_secret. */
export interface PublicUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  organizationId: string | null;
  emailVerified: boolean;
  consentAnalytics: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  province: string | null;
  billingEmail: string | null;
  contractStart: Date | null;
  contractEnd: Date | null;
  plan: OrgPlan | null;
  maxSeats: number | null;
  createdAt: Date;
}

// ─── JWT Token Payload Types ─────────────────────────────────────────────────

/** Payload encoded in the short-lived access token (15 min). */
export interface AccessTokenPayload {
  /** Subject — the user's UUID from the identity store. */
  sub: string;
  role: UserRole;
  /** Organization ID, if the user belongs to one. */
  orgId: string | undefined;
  iat: number;
  exp: number;
}

/** Payload encoded in the long-lived refresh token (7 days). */
export interface RefreshTokenPayload {
  /** Subject — the user's UUID. */
  sub: string;
  /** Unique ID of this refresh token record in the DB (used for revocation). */
  tokenId: string;
  iat: number;
  exp: number;
}

// ─── Analytics Store Types ───────────────────────────────────────────────────

/** Anonymized paramedic profile — contains NO PII whatsoever. */
export interface AnonymizedParamedicProfile {
  /** HMAC-SHA256 hash — NOT the user_id.  */
  anonymousHash: string;
  paramedicLevel: ParamedicLevel | null;
  experienceBucket: ExperienceBucket | null;
  /** Coarse region, not exact location (e.g. 'ON', 'AB'). */
  region: string | null;
  serviceType: ServiceType | null;
  lastUpdated: Date;
}

/** Scenario session record — anonymized. */
export interface ScenarioSession {
  id: string;
  anonymousHash: string;
  scenarioId: string;
  startedAt: Date;
  completedAt: Date | null;
  totalDurationSeconds: number | null;
  finalScore: number | null;
  status: SessionStatus;
}

/** A single decision captured during a session. */
export interface SessionDecision {
  id: string;
  sessionId: string;
  anonymousHash: string;
  stateOrder: number;
  decisionType: DecisionType;
  decisionValue: Record<string, unknown>;
  timeToDecisionMs: number;
  isCorrect: boolean;
  protocolAlignmentScore: number | null;
  ruleIdsApplied: string[];
  createdAt: Date;
}

// ─── Content Store Types ─────────────────────────────────────────────────────

export interface Scenario {
  id: string;
  title: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  estimatedDurationMinutes: number | null;
  learningObjectives: string[];
  status: ScenarioStatus;
  version: number;
  clinicalValidatedBy: string | null;
  clinicalValidatedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
}

export interface ScenarioState {
  id: string;
  scenarioId: string;
  stateOrder: number;
  patientPresentation: Record<string, unknown>;
  expectedActions: Record<string, unknown>;
  timeLimitSeconds: number | null;
  nextStateLogic: Record<string, unknown> | null;
}

export interface Rule {
  id: string;
  scenarioId: string;
  name: string;
  priority: number;
  conditions: Record<string, unknown>;
  outcomes: Record<string, unknown>;
  timingBonuses: Record<string, unknown> | null;
  validatedBy: string | null;
  validatedAt: Date | null;
  status: RuleStatus;
  version: number;
  createdAt: Date;
}

export interface FeedbackTemplate {
  id: string;
  ruleId: string;
  baseText: string;
  detailText: string | null;
  references: string[];
  physicianReviewed: boolean;
  createdAt: Date;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  actorType: AuditActorType;
  /** user_id for user actors, service name for system actors. */
  actorId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  result: AuditResult;
  createdAt: Date;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

/** Standard success response envelope. */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

/** Standard error response envelope — never leaks internal details in production. */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    /** Only present in development. */
    details?: unknown;
  };
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

/** Paginated list response. */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  /** Short-lived JWT. Sent in Authorization: Bearer header. */
  accessToken: string;
  /** Long-lived JWT. Stored in httpOnly cookie — NOT returned in body in production. */
  refreshToken: string;
  expiresAt: number;
}

export interface LoginResponse {
  user: PublicUser;
  accessToken: string;
  /** expiresAt is unix timestamp (ms). */
  expiresAt: number;
}

// ─── Feedback Engine Types ───────────────────────────────────────────────────

/** Output of the rule engine — returned synchronously in <50ms. */
export interface RuleOutcome {
  ruleId: string;
  isCorrect: boolean;
  score: number;
  feedbackKey: string;
  templateId: string | null;
  ruleVersion: number;
}

/** Rule-based feedback (synchronous, always available). */
export interface BaseFeedback {
  outcomeType: 'correct' | 'partial' | 'incorrect';
  score: number;
  baseText: string;
  detailText: string | null;
  references: string[];
  ruleIds: string[];
}

/** LLM-enhanced feedback (asynchronous, may be unavailable). */
export interface EnhancedFeedback extends BaseFeedback {
  enhancedText: string;
  clinicalContext: string;
  suggestedReview: string[];
  enhancedAt: Date;
}
