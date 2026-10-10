"use strict";
// ============================================================================
// File: packages/shared/src/constants/index.ts
// Version: 1.0.0 — 2026-04-20
// Why: All magic numbers, string literals, and configuration constants.
//      Using constants prevents typos and makes refactoring safe.
//      Shared across web, mobile, and backend — don't put environment-specific
//      values here (use .env for those).
// Env / Identity: Shared (web, mobile, backend)
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLM_MONTHLY_BUDGET_ALERT_USD = exports.AUDIT_LOG_RETENTION_YEARS = exports.PII_PATTERNS = exports.MAX_PAGE_SIZE = exports.DEFAULT_PAGE_SIZE = exports.RATE_LIMITS = exports.LLM_CACHE_TTL_SECONDS = exports.RULE_ENGINE_TIMEOUT_MS = exports.DECISION_TYPES = exports.SCENARIO_CATEGORIES = exports.CLINICAL_ROLES = exports.ADMIN_ROLES = exports.USER_ROLES = exports.PASSWORD_RESET_TOKEN_EXPIRES_IN_SECONDS = exports.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_SECONDS = exports.REFRESH_TOKEN_COOKIE_OPTIONS = exports.REFRESH_TOKEN_COOKIE_NAME = exports.BCRYPT_ROUNDS = exports.REFRESH_TOKEN_EXPIRES_IN_SECONDS = exports.ACCESS_TOKEN_EXPIRES_IN_SECONDS = void 0;
// ─── Auth Token Configuration ─────────────────────────────────────────────────
/** Access token lifetime in seconds. 15 minutes. */
exports.ACCESS_TOKEN_EXPIRES_IN_SECONDS = 15 * 60; // 900
/** Refresh token lifetime in seconds. 7 days. */
exports.REFRESH_TOKEN_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60; // 604800
/** bcrypt work factor. 12 is ~250ms on a modern server — slow enough to deter
 *  brute force, fast enough for UX. Do NOT reduce this below 12 in production. */
exports.BCRYPT_ROUNDS = 12;
/** Cookie name for the httpOnly refresh token. */
exports.REFRESH_TOKEN_COOKIE_NAME = 'imedica_rt';
/** Cookie options for the refresh token cookie. */
exports.REFRESH_TOKEN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true, // HTTPS only in production; set to false for local dev only
    sameSite: 'strict',
    maxAge: exports.REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000, // in milliseconds
    path: '/api/auth', // Only sent to auth routes
};
// ─── Password Reset ──────────────────────────────────────────────────────────
/** Email verification token lifetime in seconds. 24 hours. */
exports.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_SECONDS = 24 * 60 * 60;
/** Password reset token lifetime in seconds. 1 hour. */
exports.PASSWORD_RESET_TOKEN_EXPIRES_IN_SECONDS = 60 * 60;
// ─── User Roles ──────────────────────────────────────────────────────────────
exports.USER_ROLES = {
    paramedic: 'paramedic',
    admin: 'admin',
    super_admin: 'super_admin',
    clinical_validator: 'clinical_validator',
};
/** Roles that can access the admin panel. */
exports.ADMIN_ROLES = ['admin', 'super_admin'];
/** Roles that can validate clinical content. */
exports.CLINICAL_ROLES = ['clinical_validator', 'super_admin'];
// ─── Scenario ────────────────────────────────────────────────────────────────
exports.SCENARIO_CATEGORIES = [
    'cardiac',
    'trauma',
    'neuro',
    'respiratory',
    'pediatric',
    'obstetric',
    'toxicology',
];
exports.DECISION_TYPES = [
    'assessment',
    'medication',
    'procedure',
    'diagnosis',
    'transport',
];
// ─── Feedback Engine ──────────────────────────────────────────────────────────
/** Maximum time (ms) the rule engine is allowed to run synchronously.
 *  If it exceeds this, fail fast and return empty feedback. */
exports.RULE_ENGINE_TIMEOUT_MS = 50;
/** Redis TTL for cached LLM feedback responses (24 hours). */
exports.LLM_CACHE_TTL_SECONDS = 24 * 60 * 60;
// ─── Rate Limiting ───────────────────────────────────────────────────────────
exports.RATE_LIMITS = {
    /** Login: 5 attempts per 15 minutes per IP. */
    login: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
    /** Registration: 10 per hour per IP. */
    register: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
    /** Password reset: 3 per hour per IP. */
    passwordReset: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
    /** General API: 100 req/min per authenticated user. */
    api: { maxRequests: 100, windowMs: 60 * 1000 },
};
// ─── Pagination Defaults ─────────────────────────────────────────────────────
exports.DEFAULT_PAGE_SIZE = 20;
exports.MAX_PAGE_SIZE = 100;
// ─── Privacy ─────────────────────────────────────────────────────────────────
/** PII regex patterns used by the PII filter middleware and DeidentificationService.
 *  These are conservative — prefer false positives over false negatives. */
exports.PII_PATTERNS = {
    /** Standard email pattern. */
    email: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    /**
     * Canadian phone numbers — requires explicit separators to avoid matching
     * hex strings, UUIDs, and other numeric sequences.
     * Matches: 416-555-1234, (416) 555-1234, +1-416-555-1234, 416.555.1234
     * Does NOT match: plain hex strings, UUIDs, or sequences without separators.
     */
    canadianPhone: /(\+?1[\-\s])?\(?\d{3}\)?[\-\.\s]\d{3}[\-\.\s]\d{4}(?!\d)/g,
    /**
     * Canadian Social Insurance Number — must have explicit dashes or spaces.
     * Matches: 123-456-789, 123 456 789
     * Does NOT match: plain digit sequences, hex strings.
     */
    canadianSIN: /\b\d{3}[-\s]\d{3}[-\s]\d{3}\b/g,
    /** Canadian postal code. */
    postalCode: /\b[A-Za-z]\d[A-Za-z][\s-]?\d[A-Za-z]\d\b/g,
};
// ─── Audit Retention ─────────────────────────────────────────────────────────
/** Audit logs are retained for 7 years per PIPEDA requirements. */
exports.AUDIT_LOG_RETENTION_YEARS = 7;
// ─── LLM Cost Alerting ───────────────────────────────────────────────────────
/** Monthly LLM spending alert threshold in USD. */
exports.LLM_MONTHLY_BUDGET_ALERT_USD = 500;
//# sourceMappingURL=index.js.map