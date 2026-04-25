// ============================================================================
// File: apps/backend/src/lib/validate-env.ts
// Version: 1.0.0 — 2026-04-20
// Why: Validates all required environment variables at startup before the app
//      accepts any connections. Fails fast with a clear error message rather
//      than producing cryptic runtime errors mid-request.
//      Called once from src/index.ts before createApp().
// Env / Identity: Backend (Node.js startup)
// ============================================================================

import { z } from 'zod';

// ─── Environment Schema ───────────────────────────────────────────────────────

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3001),

  // Database
  DATABASE_URL: z
    .string()
    .url()
    .startsWith('postgresql://', 'DATABASE_URL must be a postgresql:// connection string'),

  // Redis (accepts redis:// for local and rediss:// for TLS/Upstash)
  REDIS_URL: z
    .string()
    .url()
    .refine(
      (url) => url.startsWith('redis://') || url.startsWith('rediss://'),
      'REDIS_URL must be a redis:// or rediss:// connection string',
    ),

  // JWT — enforce minimum secret length to deter weak secrets
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters — generate with: openssl rand -hex 64'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters — generate with: openssl rand -hex 64'),
  JWT_ACCESS_EXPIRES_IN: z.coerce.number().min(60).default(900),
  JWT_REFRESH_EXPIRES_IN: z.coerce.number().min(3600).default(604800),

  // De-identification secret (HMAC key)
  DEIDENT_SECRET: z
    .string()
    .min(32, 'DEIDENT_SECRET must be at least 32 characters — generate with: openssl rand -hex 64'),

  // Application URLs
  APP_URL: z.string().url().default('http://localhost:5173'),
  API_URL: z.string().url().default('http://localhost:3001'),

  // Email
  EMAIL_FROM: z.string().email().default('noreply@imedica.ca'),
  EMAIL_FROM_NAME: z.string().default('Imedica'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_SECURE: z.string().transform((v) => v === 'true').default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Optional (production)
  SENTRY_DSN: z.string().url().optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  ANTHROPIC_MODEL: z.string().min(1).default('claude-sonnet-4-20250514'),
  ANTHROPIC_MAX_TOKENS: z.coerce.number().int().min(1).max(8192).default(1000),
  ANTHROPIC_TIMEOUT_MS: z.coerce.number().int().min(1000).default(5000),
  SENDGRID_API_KEY: z.string().startsWith('SG.').optional(),
});

export type Env = z.infer<typeof envSchema>;

// ─── Validation ───────────────────────────────────────────────────────────────

let _env: Env | null = null;

/**
 * Validates environment variables and returns the typed env object.
 * Throws a descriptive error and exits if validation fails.
 * Memoized — safe to call multiple times.
 */
export function validateEnv(): Env {
  if (_env !== null) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error(`\n[imedica] ❌  Environment validation failed:\n${issues}\n`);
    console.error('Copy .env.example → .env and fill in the required values.\n');
    process.exit(1);
  }

  _env = result.data;
  return _env;
}

/**
 * Returns the validated env. Must call validateEnv() first.
 * Throws if called before validation (programming error).
 */
export function env(): Env {
  if (_env === null) {
    throw new Error('env() called before validateEnv(). Call validateEnv() at startup.');
  }
  return _env;
}
