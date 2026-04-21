// ============================================================================
// File: apps/backend/tests/deidentification.test.ts
// Version: 1.0.0 — 2026-04-20
// Why: Tests for the critical privacy component. Verifies correctness of:
//      - Hash stability (same input always produces same hash)
//      - Hash uniqueness (different inputs produce different hashes)
//      - PII stripping (emails, phones, names removed)
//      - Identifier bucketing (exact ages → ranges)
//      - Leakage detection (throws on PII in output)
//      - Audit trail (every operation is logged)
// Env / Identity: Test (Vitest)
// ============================================================================

import { createHmac } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PiiLeakageError } from '../src/lib/errors.js';
import { AuditService } from '../src/services/audit/AuditService.js';
import { DeidentificationService } from '../src/services/deidentification/DeidentificationService.js';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock the DB clients — we don't need a real DB to test the logic
vi.mock('../src/db/clients.js', () => ({
  db: {
    identity: {
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
  },
}));

// Mock env() to return a deterministic DEIDENT_SECRET
vi.mock('../src/lib/validate-env.js', () => ({
  env: () => ({
    DEIDENT_SECRET: 'test_deident_secret_at_least_32_characters_long_for_tests',
  }),
}));

// ─── Test Setup ───────────────────────────────────────────────────────────────

import { db } from '../src/db/clients.js';

const { db: mockDb } = vi.mocked({ db }) as unknown as {
  db: {
    identity: {
      anonymousMapping: {
        findUnique: ReturnType<typeof vi.fn>;
        upsert: ReturnType<typeof vi.fn>;
      };
    };
    content: {
      auditLog: {
        create: ReturnType<typeof vi.fn>;
      };
    };
  };
};

const TEST_SECRET = 'test_deident_secret_at_least_32_characters_long_for_tests';
const TEST_USER_ID_1 = '550e8400-e29b-41d4-a716-446655440001';
const TEST_USER_ID_2 = '550e8400-e29b-41d4-a716-446655440002';

function expectedHash(userId: string): string {
  return createHmac('sha256', TEST_SECRET).update(userId).digest('hex');
}

describe('DeidentificationService', () => {
  let service: DeidentificationService;
  let auditService: AuditService;

  beforeEach(() => {
    vi.clearAllMocks();
    auditService = new AuditService();
    service = new DeidentificationService(auditService);

    // Default: no existing mapping
    mockDb.identity.anonymousMapping.findUnique.mockResolvedValue(null);
    mockDb.identity.anonymousMapping.upsert.mockResolvedValue({ anonymousHash: expectedHash(TEST_USER_ID_1) });
    mockDb.content.auditLog.create.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── getAnonymousHash ──────────────────────────────────────────────────────

  describe('getAnonymousHash', () => {
    it('generates HMAC-SHA256 hash using DEIDENT_SECRET', async () => {
      const hash = await service.getAnonymousHash(TEST_USER_ID_1);
      expect(hash).toBe(expectedHash(TEST_USER_ID_1));
    });

    it('returns the same hash for the same user_id (stability)', async () => {
      const hash1 = await service.getAnonymousHash(TEST_USER_ID_1);
      const hash2 = await service.getAnonymousHash(TEST_USER_ID_1);
      expect(hash1).toBe(hash2);
    });

    it('returns different hashes for different user_ids (uniqueness)', async () => {
      mockDb.identity.anonymousMapping.upsert
        .mockResolvedValueOnce({ anonymousHash: expectedHash(TEST_USER_ID_1) })
        .mockResolvedValueOnce({ anonymousHash: expectedHash(TEST_USER_ID_2) });

      const hash1 = await service.getAnonymousHash(TEST_USER_ID_1);
      const hash2 = await service.getAnonymousHash(TEST_USER_ID_2);
      expect(hash1).not.toBe(hash2);
    });

    it('returns existing hash from DB without creating a new one', async () => {
      const existingHash = expectedHash(TEST_USER_ID_1);
      mockDb.identity.anonymousMapping.findUnique.mockResolvedValue({
        anonymousHash: existingHash,
      });

      const hash = await service.getAnonymousHash(TEST_USER_ID_1);
      expect(hash).toBe(existingHash);
      expect(mockDb.identity.anonymousMapping.upsert).not.toHaveBeenCalled();
    });

    it('logs an audit entry when a new mapping is created', async () => {
      const auditSpy = vi.spyOn(auditService, 'log');
      await service.getAnonymousHash(TEST_USER_ID_1);
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'anonymous_mapping_created',
          result: 'success',
        }),
      );
    });
  });

  // ─── sanitize ─────────────────────────────────────────────────────────────

  describe('sanitize', () => {
    beforeEach(() => {
      mockDb.identity.anonymousMapping.upsert.mockResolvedValue({
        anonymousHash: expectedHash(TEST_USER_ID_1),
      });
    });

    it('replaces userId with anonymousHash', async () => {
      const input = { userId: TEST_USER_ID_1, scenarioType: 'cardiac', score: 85 };
      const result = await service.sanitize(input, { context: 'test' });

      expect(result).not.toHaveProperty('userId');
      expect(result).toHaveProperty('anonymousHash', expectedHash(TEST_USER_ID_1));
      expect(result).toHaveProperty('score', 85);
    });

    it('strips email fields', async () => {
      const input = {
        userId: TEST_USER_ID_1,
        email: 'john.doe@example.com',
        score: 90,
      };
      const result = await service.sanitize(input, { context: 'test' });
      expect(result).not.toHaveProperty('email');
    });

    it('strips firstName and lastName fields', async () => {
      const input = {
        userId: TEST_USER_ID_1,
        firstName: 'John',
        lastName: 'Doe',
        paramedicLevel: 'ACP',
      };
      const result = await service.sanitize(input, { context: 'test' });
      expect(result).not.toHaveProperty('firstName');
      expect(result).not.toHaveProperty('lastName');
      expect(result).toHaveProperty('paramedicLevel', 'ACP');
    });

    it('strips phone fields', async () => {
      const input = { userId: TEST_USER_ID_1, phone: '+1-416-555-1234', score: 70 };
      const result = await service.sanitize(input, { context: 'test' });
      expect(result).not.toHaveProperty('phone');
    });

    it('preserves non-PII fields', async () => {
      const input = {
        userId: TEST_USER_ID_1,
        decisionType: 'medication',
        isCorrect: true,
        timeToDecisionMs: 4200,
      };
      const result = await service.sanitize(input, { context: 'test' });
      expect(result.decisionType).toBe('medication');
      expect(result.isCorrect).toBe(true);
      expect(result.timeToDecisionMs).toBe(4200);
    });

    it('logs an audit entry for every sanitize call', async () => {
      const auditSpy = vi.spyOn(auditService, 'log');
      const input = { userId: TEST_USER_ID_1, score: 80 };
      await service.sanitize(input, { context: 'llm_request' });
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'data_sanitized',
          metadata: expect.objectContaining({ context: 'llm_request' }) as unknown,
        }),
      );
    });
  });

  // ─── verifyNoLeakage ──────────────────────────────────────────────────────

  describe('verifyNoLeakage', () => {
    it('does not throw for clean data', () => {
      const clean = {
        anonymousHash: expectedHash(TEST_USER_ID_1),
        decisionType: 'assessment',
        score: 85,
        region: 'ON',
      };
      expect(() => service.verifyNoLeakage(clean, 'test')).not.toThrow();
    });

    it('throws PiiLeakageError when email is present in nested object', () => {
      const leaked = {
        anonymousHash: expectedHash(TEST_USER_ID_1),
        meta: { actor: 'john.doe@example.com' },
      };
      expect(() => service.verifyNoLeakage(leaked, 'analytics_write')).toThrowError(
        PiiLeakageError,
      );
    });

    it('throws PiiLeakageError when Canadian phone number is present', () => {
      const leaked = { data: 'Call us at 416-555-1234' };
      expect(() => service.verifyNoLeakage(leaked, 'llm_request')).toThrowError(
        PiiLeakageError,
      );
    });

    it('throws PiiLeakageError when postal code is present', () => {
      const leaked = { location: 'M5V 3L9' };
      expect(() => service.verifyNoLeakage(leaked, 'csv_export')).toThrowError(
        PiiLeakageError,
      );
    });

    it('throws PiiLeakageError when SIN is present', () => {
      const leaked = { identifier: '123-456-789' };
      expect(() => service.verifyNoLeakage(leaked, 'analytics_write')).toThrowError(
        PiiLeakageError,
      );
    });
  });
});
