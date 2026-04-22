// ============================================================================
// File: apps/backend/src/middleware/rate-limit.ts
// Version: 1.0.0 — 2026-04-20
// Why: Brute-force and DoS protection for sensitive endpoints.
//      Auth endpoints get much stricter limits than general API endpoints.
//      Uses in-memory store for local dev — swap to Redis store for production.
// Env / Identity: Backend (Express middleware)
// ============================================================================

import { RATE_LIMITS } from '@imedica/shared';
import expressRateLimit from 'express-rate-limit';

// ─── Environment Helpers ─────────────────────────────────────────────────────

const isDev = process.env['NODE_ENV'] === 'development';
const isTest = process.env['NODE_ENV'] === 'test';

// ─── Rate Limiters ────────────────────────────────────────────────────────────

/**
 * Login rate limiter: 5 attempts per 15 minutes per IP.
 * Prevents password brute-forcing.
 */
export const loginLimiter = expressRateLimit({
  windowMs: RATE_LIMITS.login.windowMs,
  max: RATE_LIMITS.login.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please wait 15 minutes before trying again.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // In production: replace with RedisStore from rate-limit-redis
  // The in-memory store resets on server restart — fine for MVP
  skip: (req) => isTest || isDev || req.ip === '127.0.0.1',
});

/**
 * Registration rate limiter: 10 per hour per IP.
 * Prevents bulk account creation.
 */
export const registerLimiter = expressRateLimit({
  windowMs: RATE_LIMITS.register.windowMs,
  max: RATE_LIMITS.register.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many accounts created from this IP. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest || isDev,
});

/**
 * Password reset rate limiter: 3 per hour per IP.
 * Prevents email flood attacks via the reset endpoint.
 */
export const passwordResetLimiter = expressRateLimit({
  windowMs: RATE_LIMITS.passwordReset.windowMs,
  max: RATE_LIMITS.passwordReset.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset requests. Please wait before trying again.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest || isDev,
});

/**
 * General API rate limiter: 100 requests per minute.
 * Applied to all authenticated API routes as a backstop.
 */
export const apiLimiter = expressRateLimit({
  windowMs: RATE_LIMITS.api.windowMs,
  max: RATE_LIMITS.api.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest || isDev,
});
