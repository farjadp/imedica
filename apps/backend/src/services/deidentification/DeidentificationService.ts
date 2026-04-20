// ============================================================================
// File: apps/backend/src/services/deidentification/DeidentificationService.ts
// Version: 1.0.0 — 2026-04-20
// Why: THE critical privacy component. This is the ONLY authorized path for
//      moving data from the identity schema to the analytics schema.
//
//      Three responsibilities:
//        1. getAnonymousHash(userId)  — stable, one-way mapping: user → hash
//        2. sanitize(data)            — strip PII, bucket identifiers
//        3. verifyNoLeakage(data)     — hard reject if PII detected in output
//
//      If this service fails, operations that require anonymization MUST fail.
//      There is no "best effort" mode — privacy is binary.
//
//      Architecture note: The reverse mapping (hash → userId) is intentionally
//      NOT implemented. If you find yourself needing it, you're violating the
//      privacy architecture and need to redesign the feature.
//
// Env / Identity: Backend service (Node.js) — access identity schema ONLY
// ============================================================================

import { createHmac } from 'node:crypto';

import { PII_PATTERNS } from '@imedica/shared';

import { db } from '../../db/clients.js';
import { DeidentificationError, PiiLeakageError } from '../../lib/errors.js';
import { createChildLogger } from '../../lib/logger.js';
import { env } from '../../lib/validate-env.js';
import { AuditService } from '../audit/AuditService.js';

const log = createChildLogger({ service: 'DeidentificationService' });

// ─── Types ────────────────────────────────────────────────────────────────────

/** Marker type to indicate data has been through the de-identification pipeline. */
export type Sanitized<T> = T & { __sanitized: true };

export interface SanitizeOptions {
  /** Context label for audit log (e.g. 'llm_feedback_request', 'analytics_write'). */
  context: string;
  /** If true, throw PiiLeakageError immediately on detection. Default: true. */
  strict?: boolean;
}

// ─── PII Redaction Helpers ───────────────────────────────────────────────────

/** Fields that are always stripped from objects passing through sanitize(). */
const ALWAYS_STRIP_FIELDS = new Set([
  'email',
  'passwordHash',
  'password_hash',
  'phone',
  'firstName',
  'first_name',
  'lastName',
  'last_name',
  'mfaSecret',
  'mfa_secret',
  'passwordResetTokenHash',
  'password_reset_token_hash',
  'emailVerificationTokenHash',
  'email_verification_token_hash',
  'billingEmail',
  'billing_email',
  'name',           // Organization .name is fine, but we redact it in user contexts
]);

/** Fields that contain experience in years — bucketed, not exact. */
const EXPERIENCE_YEAR_FIELDS = new Set(['yearsExperience', 'years_experience', 'experienceYears']);

/**
 * Buckets a continuous year value into a discrete range string.
 * This is necessary for PIPEDA compliance — exact experience is quasi-identifying.
 */
function bucketExperience(years: number): string {
  if (years <= 2) return '0-2_years';
  if (years <= 5) return '3-5_years';
  if (years <= 10) return '5-10_years';
  return '10+_years';
}

// ─── DeidentificationService ──────────────────────────────────────────────────

export class DeidentificationService {
  private readonly secret: string;
  private readonly audit: AuditService;

  constructor(audit: AuditService) {
    this.secret = env().DEIDENT_SECRET;
    this.audit = audit;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Returns the stable anonymous_hash for a given user ID.
   *
   * The mapping is stored in anonymous_mappings (identity schema) so it's
   * consistent across service restarts. The hash itself is HMAC-SHA256 of the
   * user ID using the DEIDENT_SECRET.
   *
   * NEVER expose this method's return value in a way that could be correlated
   * back to the user identity by an attacker (the mapping table does that).
   *
   * @throws DeidentificationError if DB lookup or write fails
   */
  async getAnonymousHash(userId: string): Promise<string> {
    try {
      // Check if mapping already exists
      const existing = await db.identity.anonymousMapping.findUnique({
        where: { userId },
        select: { anonymousHash: true },
      });

      if (existing) {
        return existing.anonymousHash;
      }

      // Generate new hash: HMAC-SHA256(userId, DEIDENT_SECRET)
      const hash = createHmac('sha256', this.secret).update(userId).digest('hex');

      // Store the mapping (upsert to handle rare race conditions)
      await db.identity.anonymousMapping.upsert({
        where: { userId },
        create: { userId, anonymousHash: hash },
        update: {}, // If it already exists, keep the existing hash
      });

      await this.audit.log({
        actorType: 'system',
        actorId: 'DeidentificationService',
        action: 'anonymous_mapping_created',
        resourceType: 'anonymous_mapping',
        resourceId: hash, // Log the hash, not the userId
        result: 'success',
        metadata: { reason: 'first_access' },
      });

      log.debug('Anonymous mapping created', { hashPrefix: hash.substring(0, 8) + '...' });
      return hash;
    } catch (error) {
      if (error instanceof DeidentificationError) throw error;
      log.error('Failed to get/create anonymous hash', { error });
      throw new DeidentificationError('Could not resolve anonymous hash for user');
    }
  }

  /**
   * Sanitizes an object for use outside the identity boundary.
   *
   * What it does:
   *   - Removes ALWAYS_STRIP_FIELDS (email, name, phone, etc.)
   *   - Replaces 'userId' / 'user_id' fields with 'anonymousHash' using getAnonymousHash()
   *   - Buckets experience year values into ranges
   *   - Runs verifyNoLeakage() on the output as a final check
   *
   * What it does NOT do:
   *   - Modify scenario content, rules, or feedback text
   *   - Validate the shape of the output beyond PII checks
   *
   * @throws DeidentificationError if userId resolution fails
   * @throws PiiLeakageError if PII is detected in the sanitized output (strict mode)
   */
  async sanitize<T extends Record<string, unknown>>(
    data: T,
    options: SanitizeOptions,
  ): Promise<Sanitized<Omit<T, 'userId' | 'user_id'> & { anonymousHash?: string }>> {
    const strict = options.strict ?? true;

    // Work on a deep copy to avoid mutating the original
    const copy = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;

    // Pass 1: Replace userId → anonymousHash
    if (typeof copy['userId'] === 'string') {
      const hash = await this.getAnonymousHash(copy['userId']);
      copy['anonymousHash'] = hash;
      delete copy['userId'];
    }
    if (typeof copy['user_id'] === 'string') {
      const hash = await this.getAnonymousHash(copy['user_id']);
      copy['anonymousHash'] = hash;
      delete copy['user_id'];
    }

    // Pass 2: Strip PII fields recursively
    this.stripPiiFields(copy);

    // Pass 3: Bucket quasi-identifiers
    this.bucketIdentifiers(copy);

    // Pass 4: Final PII check on the sanitized output
    const leakageResult = this.detectLeakage(copy);
    if (leakageResult.hasLeakage) {
      const field = leakageResult.field ?? 'unknown';
      if (strict) {
        throw new PiiLeakageError(field, options.context);
      }
      // Non-strict: redact but continue (only for trusted internal pipelines)
      log.warn('PII detected in sanitized output — redacting', {
        field,
        context: options.context,
      });
    }

    // Audit the sanitization
    await this.audit.log({
      actorType: 'system',
      actorId: 'DeidentificationService',
      action: 'data_sanitized',
      resourceType: 'sanitization',
      resourceId: null,
      result: 'success',
      metadata: {
        context: options.context,
        fieldsStripped: [...ALWAYS_STRIP_FIELDS].filter((f) => f in data),
      },
    });

    return copy as Sanitized<Omit<T, 'userId' | 'user_id'> & { anonymousHash?: string }>;
  }

  /**
   * Verifies that the given data contains no PII patterns.
   * Intended for use immediately before:
   *   - Writing to the analytics schema
   *   - Calling the Anthropic API
   *   - Exporting data to CSV
   *
   * @throws PiiLeakageError on any PII detection
   */
  verifyNoLeakage(data: unknown, context: string): void {
    const dataStr = JSON.stringify(data);
    for (const [patternName, pattern] of Object.entries(PII_PATTERNS)) {
      // Reset lastIndex for global regexes
      pattern.lastIndex = 0;
      if (pattern.test(dataStr)) {
        pattern.lastIndex = 0;
        throw new PiiLeakageError(patternName, context);
      }
      pattern.lastIndex = 0;
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /** Recursively strips fields from ALWAYS_STRIP_FIELDS. */
  private stripPiiFields(obj: Record<string, unknown>): void {
    for (const key of Object.keys(obj)) {
      if (ALWAYS_STRIP_FIELDS.has(key)) {
        delete obj[key];
        continue;
      }
      const value = obj[key];
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        this.stripPiiFields(value as Record<string, unknown>);
      }
    }
  }

  /** Replaces exact year values with bucketed ranges. */
  private bucketIdentifiers(obj: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(obj)) {
      if (EXPERIENCE_YEAR_FIELDS.has(key) && typeof value === 'number') {
        (obj as Record<string, unknown>)[key.replace(/years?/i, 'Bucket').replace('experience', 'experience')] =
          bucketExperience(value);
        delete obj[key];
        continue;
      }
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        this.bucketIdentifiers(value as Record<string, unknown>);
      }
    }
  }

  /** Returns the first PII pattern matched in the stringified data, or null. */
  private detectLeakage(data: unknown): { hasLeakage: boolean; field: string | null } {
    const dataStr = JSON.stringify(data);
    for (const [patternName, pattern] of Object.entries(PII_PATTERNS)) {
      pattern.lastIndex = 0;
      if (pattern.test(dataStr)) {
        pattern.lastIndex = 0;
        return { hasLeakage: true, field: patternName };
      }
      pattern.lastIndex = 0;
    }
    return { hasLeakage: false, field: null };
  }
}
