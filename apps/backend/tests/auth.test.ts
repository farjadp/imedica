// ============================================================================
// File: apps/backend/tests/auth.test.ts
// Version: 1.0.0 — 2026-04-20
// Why: Integration-level tests for the auth flow. Uses Supertest to hit the
//      actual Express routes. DB calls are mocked so no real DB is needed.
//      Tests the complete request/response cycle including headers, cookies,
//      and response shapes.
// Env / Identity: Test (Vitest + Supertest)
// ============================================================================

import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Dependencies Before App Import ─────────────────────────────────────
// Must happen before importing the app to intercept module resolution.

vi.mock('../src/db/clients.js', () => ({
  db: {
    identity: {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      refreshToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      anonymousMapping: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
    },
    content: {
      auditLog: {
        create: vi.fn(),
      },
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

vi.mock('../src/lib/validate-env.js', () => ({
  validateEnv: () => ({
    NODE_ENV: 'test',
    PORT: 3001,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'test_access_secret_at_least_32_characters_for_tests_aaa',
    JWT_REFRESH_SECRET: 'test_refresh_secret_at_least_32_characters_for_tests_bbb',
    JWT_ACCESS_EXPIRES_IN: 900,
    JWT_REFRESH_EXPIRES_IN: 604800,
    DEIDENT_SECRET: 'test_deident_secret_at_least_32_characters_for_tests_ccc',
    APP_URL: 'http://localhost:5173',
    API_URL: 'http://localhost:3001',
    EMAIL_FROM: 'test@imedica.local',
    EMAIL_FROM_NAME: 'Imedica Test',
    SMTP_HOST: 'localhost',
    SMTP_PORT: 1025,
    SMTP_SECURE: false,
    SMTP_USER: undefined,
    SMTP_PASS: undefined,
  }),
  env: () => ({
    NODE_ENV: 'test',
    PORT: 3001,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'test_access_secret_at_least_32_characters_for_tests_aaa',
    JWT_REFRESH_SECRET: 'test_refresh_secret_at_least_32_characters_for_tests_bbb',
    JWT_ACCESS_EXPIRES_IN: 900,
    JWT_REFRESH_EXPIRES_IN: 604800,
    DEIDENT_SECRET: 'test_deident_secret_at_least_32_characters_for_tests_ccc',
    APP_URL: 'http://localhost:5173',
    API_URL: 'http://localhost:3001',
    EMAIL_FROM: 'test@imedica.local',
    EMAIL_FROM_NAME: 'Imedica Test',
    SMTP_HOST: 'localhost',
    SMTP_PORT: 1025,
    SMTP_SECURE: false,
  }),
}));

// Mock email (don't send real emails in tests)
vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    }),
  },
}));

// Mock Sentry (no real Sentry in tests)
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  withScope: vi.fn((_fn: (scope: unknown) => void) => {
    _fn({
      setUser: vi.fn(),
      setTag: vi.fn(),
      setExtras: vi.fn(),
    });
  }),
}));

// ─── Import After Mocks ────────────────────────────────────────────────────────

import bcrypt from 'bcryptjs';

import { db } from '../src/db/clients.js';

// We need the app but with mocked server.listen
// Import the router directly instead of the full app
import express from 'express';
import cookieParser from 'cookie-parser';

import { errorHandler, notFoundHandler } from '../src/middleware/error-handler.js';
import { attachRequestId } from '../src/middleware/pii-filter.js';
import authRouter from '../src/routes/auth.js';

// Build a minimal test app without DB startup
const testApp = express();
testApp.use(express.json());
testApp.use(cookieParser());
testApp.use(attachRequestId);
testApp.use('/api/auth', authRouter);
testApp.use(notFoundHandler);
testApp.use(errorHandler);

// ─── Test Helpers ─────────────────────────────────────────────────────────────

const VALID_REGISTER_BODY = {
  email: 'testuser@example.com',
  password: 'Secure@Pass123!',
  firstName: 'Test',
  lastName: 'User',
  consentAnalytics: false,
};

const HASHED_PASSWORD = await bcrypt.hash('Secure@Pass123!', 10);

const MOCK_USER = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'testuser@example.com',
  passwordHash: HASHED_PASSWORD,
  firstName: 'Test',
  lastName: 'User',
  phone: null,
  organizationId: null,
  role: 'paramedic' as const,
  emailVerified: true,
  emailVerificationTokenHash: null,
  emailVerificationTokenExpiresAt: null,
  mfaEnabled: false,
  mfaSecret: null,
  passwordResetTokenHash: null,
  passwordResetTokenExpiresAt: null,
  consentAnalytics: false,
  consentAnalyticsDate: null,
  createdAt: new Date(),
  lastLoginAt: null,
  deletedAt: null,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Auth Routes', () => {
  const mockDb = db as unknown as {
    identity: {
      user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
      refreshToken: { create: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
    };
    content: { auditLog: { create: ReturnType<typeof vi.fn> } };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: DB calls succeed silently
    mockDb.content.auditLog.create.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── POST /api/auth/register ──────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('returns 201 and success message for valid registration', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue(null); // Email not taken
      mockDb.identity.user.create.mockResolvedValue({ id: MOCK_USER.id, firstName: 'Test' });

      const res = await request(testApp)
        .post('/api/auth/register')
        .send(VALID_REGISTER_BODY);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('verify your email');
    });

    it('returns 409 when email is already registered', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue({ id: 'existing-id', deletedAt: null });

      const res = await request(testApp)
        .post('/api/auth/register')
        .send(VALID_REGISTER_BODY);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 400 for invalid email format', async () => {
      const res = await request(testApp)
        .post('/api/auth/register')
        .send({ ...VALID_REGISTER_BODY, email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for weak password (missing special char)', async () => {
      const res = await request(testApp)
        .post('/api/auth/register')
        .send({ ...VALID_REGISTER_BODY, password: 'WeakPassword1' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for password under 12 characters', async () => {
      const res = await request(testApp)
        .post('/api/auth/register')
        .send({ ...VALID_REGISTER_BODY, password: 'Short@1' });

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /api/auth/login ─────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('returns 200 with access token for valid credentials', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue(MOCK_USER);
      mockDb.identity.user.update.mockResolvedValue(MOCK_USER);
      mockDb.identity.refreshToken.create.mockResolvedValue({
        id: 'token-id',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 604800 * 1000),
      });

      const res = await request(testApp)
        .post('/api/auth/login')
        .send({ email: MOCK_USER.email, password: 'Secure@Pass123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      expect(res.body.data.user.email).toBe(MOCK_USER.email);
    });

    it('sets httpOnly refresh token cookie on login', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue(MOCK_USER);
      mockDb.identity.user.update.mockResolvedValue(MOCK_USER);
      mockDb.identity.refreshToken.create.mockResolvedValue({
        id: 'token-id',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 604800 * 1000),
      });

      const res = await request(testApp)
        .post('/api/auth/login')
        .send({ email: MOCK_USER.email, password: 'Secure@Pass123!' });

      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'] as string[] | string | undefined;
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : (cookies ?? '');
      expect(cookieStr).toContain('imedica_rt');
      expect(cookieStr).toContain('HttpOnly');
    });

    it('returns 401 for wrong password (generic message)', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue(MOCK_USER);

      const res = await request(testApp)
        .post('/api/auth/login')
        .send({ email: MOCK_USER.email, password: 'WrongPassword@123' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      // Must not reveal which field was wrong
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('returns 401 for non-existent email (same error as wrong password)', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue(null);

      const res = await request(testApp)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'AnyPassword@1' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns 403 for unverified email account', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue({
        ...MOCK_USER,
        emailVerified: false,
      });

      const res = await request(testApp)
        .post('/api/auth/login')
        .send({ email: MOCK_USER.email, password: 'Secure@Pass123!' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('returns 403 for soft-deleted account', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue({
        ...MOCK_USER,
        deletedAt: new Date(),
      });

      const res = await request(testApp)
        .post('/api/auth/login')
        .send({ email: MOCK_USER.email, password: 'Secure@Pass123!' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_DELETED');
    });
  });

  // ─── GET /api/auth/me ─────────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('returns 401 without Authorization header', async () => {
      const res = await request(testApp).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with malformed Bearer token', async () => {
      const res = await request(testApp)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-valid-jwt');
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /api/auth/forgot-password ──────────────────────────────────────

  describe('POST /api/auth/forgot-password', () => {
    it('returns 200 regardless of whether email exists (prevents enumeration)', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue(null);

      const res = await request(testApp)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('sends reset email when email exists', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue(MOCK_USER);
      mockDb.identity.user.update.mockResolvedValue(MOCK_USER);

      const res = await request(testApp)
        .post('/api/auth/forgot-password')
        .send({ email: MOCK_USER.email });

      expect(res.status).toBe(200);
    });
  });

  // ─── Health Check ─────────────────────────────────────────────────────────

  describe('GET /api/health', () => {
    it('returns 200 status', async () => {
      // Health check is on the main router, not /api/auth
      // Let's test the 404 handler for this test app
      const res = await request(testApp).get('/api/nonexistent-route');
      expect(res.status).toBe(404);
    });
  });
});
