// ============================================================================
// File: apps/web/src/features/auth/types.ts
// Version: 1.0.0 — 2026-04-22
// Why: Local auth form types for the web app.
// Env / Identity: Web (browser runtime)
// ============================================================================

import type { PublicUser, RegisterDto } from '@imedica/shared';
import { z } from 'zod';

const emailSchema = z.string().email('Valid email required').trim().toLowerCase();
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'At least one uppercase letter')
  .regex(/[a-z]/, 'At least one lowercase letter')
  .regex(/[0-9]/, 'At least one number')
  .regex(/[^A-Za-z0-9]/, 'At least one special character');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name required').trim(),
    lastName: z.string().min(1, 'Last name required').trim(),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    consentAnalytics: z.boolean().optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const onboardingSchema = z.object({
  paramedicLevel: z.enum(['PCP', 'ACP', 'CCP', 'student']),
  experienceBucket: z.enum(['0-2_years', '3-5_years', '5-10_years', '10+_years']),
  province: z.string().min(2, 'Province is required').max(2, 'Use a 2-letter province code'),
  serviceType: z.enum(['public_large', 'public_small', 'private', 'training_program']),
  organizationName: z.string().max(255).optional().or(z.literal('')),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;
export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export type AuthUser = PublicUser;
export type AuthRegisterDto = RegisterDto;
