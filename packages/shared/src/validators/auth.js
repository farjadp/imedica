"use strict";
// ============================================================================
// File: packages/shared/src/validators/auth.ts
// Version: 1.0.0 — 2026-04-20
// Why: Zod schemas for all auth API boundaries. Used for runtime validation on
//      both backend (request parsing) and frontend (form validation).
//      Keeping schemas in shared/ ensures frontend and backend stay in sync.
// Env / Identity: Shared (web, mobile, backend)
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshSchema = exports.VerifyEmailSchema = exports.ResetPasswordSchema = exports.ForgotPasswordSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
// ─── Reusable Field Schemas ──────────────────────────────────────────────────
/** Password rules: 12+ chars, upper, lower, number, special character. */
const passwordSchema = zod_1.z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
const emailSchema = zod_1.z
    .string()
    .email('Invalid email address')
    .max(254, 'Email must be at most 254 characters')
    .toLowerCase()
    .trim();
const uuidSchema = zod_1.z.string().uuid('Invalid identifier format');
// ─── Auth Request Schemas ────────────────────────────────────────────────────
/** POST /api/auth/register */
exports.RegisterSchema = zod_1.z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: zod_1.z.string().min(1, 'First name is required').max(100).trim().optional(),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(100).trim().optional(),
    organizationId: uuidSchema.optional(),
    /** Explicit opt-in for anonymized analytics collection (required for PIPEDA). */
    consentAnalytics: zod_1.z.boolean().default(false),
});
/** POST /api/auth/login */
exports.LoginSchema = zod_1.z.object({
    email: emailSchema,
    password: zod_1.z.string().min(1, 'Password is required').max(128),
    /** Optional TOTP code for MFA-enabled accounts. */
    totpCode: zod_1.z.string().length(6).optional(),
});
/** POST /api/auth/forgot-password */
exports.ForgotPasswordSchema = zod_1.z.object({
    email: emailSchema,
});
/** POST /api/auth/reset-password */
exports.ResetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
    confirmPassword: zod_1.z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
/** POST /api/auth/verify-email */
exports.VerifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Verification token is required'),
});
/** POST /api/auth/refresh
 *  Note: The refresh token is read from the httpOnly cookie on the server.
 *  This schema just documents that no body is needed. */
exports.RefreshSchema = zod_1.z.object({}).strict();
//# sourceMappingURL=auth.js.map