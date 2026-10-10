import type { UserRole, ScenarioCategory, DecisionType } from '../types/index';
/** Access token lifetime in seconds. 15 minutes. */
export declare const ACCESS_TOKEN_EXPIRES_IN_SECONDS: number;
/** Refresh token lifetime in seconds. 7 days. */
export declare const REFRESH_TOKEN_EXPIRES_IN_SECONDS: number;
/** bcrypt work factor. 12 is ~250ms on a modern server — slow enough to deter
 *  brute force, fast enough for UX. Do NOT reduce this below 12 in production. */
export declare const BCRYPT_ROUNDS = 12;
/** Cookie name for the httpOnly refresh token. */
export declare const REFRESH_TOKEN_COOKIE_NAME = "imedica_rt";
/** Cookie options for the refresh token cookie. */
export declare const REFRESH_TOKEN_COOKIE_OPTIONS: {
    readonly httpOnly: true;
    readonly secure: true;
    readonly sameSite: "strict";
    readonly maxAge: number;
    readonly path: "/api/auth";
};
/** Email verification token lifetime in seconds. 24 hours. */
export declare const EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_SECONDS: number;
/** Password reset token lifetime in seconds. 1 hour. */
export declare const PASSWORD_RESET_TOKEN_EXPIRES_IN_SECONDS: number;
export declare const USER_ROLES: Record<UserRole, UserRole>;
/** Roles that can access the admin panel. */
export declare const ADMIN_ROLES: UserRole[];
/** Roles that can validate clinical content. */
export declare const CLINICAL_ROLES: UserRole[];
export declare const SCENARIO_CATEGORIES: ScenarioCategory[];
export declare const DECISION_TYPES: DecisionType[];
/** Maximum time (ms) the rule engine is allowed to run synchronously.
 *  If it exceeds this, fail fast and return empty feedback. */
export declare const RULE_ENGINE_TIMEOUT_MS = 50;
/** Redis TTL for cached LLM feedback responses (24 hours). */
export declare const LLM_CACHE_TTL_SECONDS: number;
export declare const RATE_LIMITS: {
    /** Login: 5 attempts per 15 minutes per IP. */
    readonly login: {
        readonly maxRequests: 5;
        readonly windowMs: number;
    };
    /** Registration: 10 per hour per IP. */
    readonly register: {
        readonly maxRequests: 10;
        readonly windowMs: number;
    };
    /** Password reset: 3 per hour per IP. */
    readonly passwordReset: {
        readonly maxRequests: 3;
        readonly windowMs: number;
    };
    /** General API: 100 req/min per authenticated user. */
    readonly api: {
        readonly maxRequests: 100;
        readonly windowMs: number;
    };
};
export declare const DEFAULT_PAGE_SIZE = 20;
export declare const MAX_PAGE_SIZE = 100;
/** PII regex patterns used by the PII filter middleware and DeidentificationService.
 *  These are conservative — prefer false positives over false negatives. */
export declare const PII_PATTERNS: {
    /** Standard email pattern. */
    readonly email: RegExp;
    /**
     * Canadian phone numbers — requires explicit separators to avoid matching
     * hex strings, UUIDs, and other numeric sequences.
     * Matches: 416-555-1234, (416) 555-1234, +1-416-555-1234, 416.555.1234
     * Does NOT match: plain hex strings, UUIDs, or sequences without separators.
     */
    readonly canadianPhone: RegExp;
    /**
     * Canadian Social Insurance Number — must have explicit dashes or spaces.
     * Matches: 123-456-789, 123 456 789
     * Does NOT match: plain digit sequences, hex strings.
     */
    readonly canadianSIN: RegExp;
    /** Canadian postal code. */
    readonly postalCode: RegExp;
};
/** Audit logs are retained for 7 years per PIPEDA requirements. */
export declare const AUDIT_LOG_RETENTION_YEARS = 7;
/** Monthly LLM spending alert threshold in USD. */
export declare const LLM_MONTHLY_BUDGET_ALERT_USD = 500;
//# sourceMappingURL=index.d.ts.map