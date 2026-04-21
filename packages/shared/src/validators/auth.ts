// ============================================================================
// File: packages/shared/src/validators/auth.ts
// Version: 1.0.0 — 2026-04-20
// Why: Zod schemas for all auth API boundaries. Used for runtime validation on
//      both backend (request parsing) and frontend (form validation).
//      Keeping schemas in shared/ ensures frontend and backend stay in sync.
// Env / Identity: Shared (web, mobile, backend)
// ============================================================================

import { z } from 'zod';

// ─── Reusable Field Schemas ──────────────────────────────────────────────────

/** Password rules: 12+ chars, upper, lower, number, special character. */
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(254, 'Email must be at most 254 characters')
  .toLowerCase()
  .trim();

const uuidSchema = z.string().uuid('Invalid identifier format');

// ─── Auth Request Schemas ────────────────────────────────────────────────────

/** POST /api/auth/register */
export const RegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(100).trim().optional(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim().optional(),
  organizationId: uuidSchema.optional(),
  /** Explicit opt-in for anonymized analytics collection (required for PIPEDA). */
  consentAnalytics: z.boolean().default(false),
});

/** POST /api/auth/login */
export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
  /** Optional TOTP code for MFA-enabled accounts. */
  totpCode: z.string().length(6).optional(),
});

/** POST /api/auth/forgot-password */
export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

/** POST /api/auth/reset-password */
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/** POST /api/auth/verify-email */
export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/** POST /api/auth/refresh
 *  Note: The refresh token is read from the httpOnly cookie on the server.
 *  This schema just documents that no body is needed. */
export const RefreshSchema = z.object({}).strict();

// ─── Exported Types ──────────────────────────────────────────────────────────

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;
