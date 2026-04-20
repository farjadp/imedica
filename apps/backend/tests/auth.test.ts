// ============================================================================
// File: apps/backend/tests/auth.test.ts
// Version: 1.0.2 — 2026-04-20
// Why: Uses @backend/ alias instead of relative paths to avoid Vite URL
//      encoding issues with the Google Drive path containing spaces.
// Env / Identity: Test (Vitest + Supertest)
// ============================================================================

import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Dependencies Before App Import ─────────────────────────────────────

vi.mock('@backend/db/clients', () => ({
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
      anonymousMapping: { findUnique: vi.fn(), upsert: vi.fn() },
    },
    content: { auditLog: { create: vi.fn() } },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
  prisma: { $connect: vi.fn(), $disconnect: vi.fn() },
}));

// Inline env object inside vi.mock factory — vi.mock hoisting means this
// must not reference variables declared in the module scope.
vi.mock('@backend/lib/validate-env', () => ({
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
    SMTP_USER: undefined,
    SMTP_PASS: undefined,
  }),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    }),
  },
}));

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  withScope: vi.fn((fn: (scope: unknown) => void) => {
    fn({ setUser: vi.fn(), setTag: vi.fn(), setExtras: vi.fn() });
  }),
}));

// ─── Build test Express app ───────────────────────────────────────────────────

import bcrypt from 'bcryptjs';
import express from 'express';
import cookieParser from 'cookie-parser';
import { db } from '@backend/db/clients';
import authRouter from '@backend/routes/auth';
import { errorHandler, notFoundHandler } from '@backend/middleware/error-handler';
import { attachRequestId } from '@backend/middleware/pii-filter';

const testApp = express();
testApp.use(express.json());
testApp.use(cookieParser());
testApp.use(attachRequestId);
testApp.use('/api/auth', authRouter);
testApp.use(notFoundHandler);
testApp.use(errorHandler);

// ─── Test Data ────────────────────────────────────────────────────────────────

const VALID_REGISTER_BODY = {
  email: 'testuser@example.com',
  password: 'Secure@Pass123!',
  firstName: 'Test',
  lastName: 'User',
  consentAnalytics: false,
};

// Top-level await works in Vitest's ESM context
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
      user: {
        findUnique: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        findMany: ReturnType<typeof vi.fn>;
      };
      refreshToken: {
        create: ReturnType<typeof vi.fn>;
        findUnique: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        updateMany: ReturnType<typeof vi.fn>;
      };
    };
    content: { auditLog: { create: ReturnType<typeof vi.fn> } };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.content.auditLog.create.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('returns 201 for valid registration', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue(null);
      mockDb.identity.user.create.mockResolvedValue({ id: MOCK_USER.id, firstName: 'Test' });

      const res = await request(testApp).post('/api/auth/register').send(VALID_REGISTER_BODY);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('verify your account');
    });

    it('returns 409 when email is already registered', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue({ id: 'existing-id', deletedAt: null });

      const res = await request(testApp).post('/api/auth/register').send(VALID_REGISTER_BODY);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 400 for invalid email format', async () => {
      const res = await request(testApp)
        .post('/api/auth/register')
        .send({ ...VALID_REGISTER_BODY, email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for weak password', async () => {
      const res = await request(testApp)
        .post('/api/auth/register')
        .send({ ...VALID_REGISTER_BODY, password: 'WeakPassword1' });

      expect(res.status).toBe(400);
    });
  });

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
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
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

      const cookies = res.headers['set-cookie'] as string[] | string | undefined;
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : (cookies ?? '');
      expect(cookieStr).toContain('imedica_rt');
      expect(cookieStr).toContain('HttpOnly');
    });

    it('returns 401 with generic message for wrong password', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue(MOCK_USER);

      const res = await request(testApp)
        .post('/api/auth/login')
        .send({ email: MOCK_USER.email, password: 'WrongPassword@123' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('returns 401 for non-existent email', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue(null);

      const res = await request(testApp)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'AnyPassword@1' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns 403 for unverified email', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue({
        ...MOCK_USER, emailVerified: false,
      });

      const res = await request(testApp)
        .post('/api/auth/login')
        .send({ email: MOCK_USER.email, password: 'Secure@Pass123!' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('returns 403 for soft-deleted account', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue({
        ...MOCK_USER, deletedAt: new Date(),
      });

      const res = await request(testApp)
        .post('/api/auth/login')
        .send({ email: MOCK_USER.email, password: 'Secure@Pass123!' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_DELETED');
    });
  });

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

  describe('POST /api/auth/forgot-password', () => {
    it('returns 200 even for non-existent email (prevents enumeration)', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue(null);

      const res = await request(testApp)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 200 when email exists', async () => {
      mockDb.identity.user.findUnique.mockResolvedValue(MOCK_USER);
      mockDb.identity.user.update.mockResolvedValue(MOCK_USER);

      const res = await request(testApp)
        .post('/api/auth/forgot-password')
        .send({ email: MOCK_USER.email });

      expect(res.status).toBe(200);
    });
  });
});
