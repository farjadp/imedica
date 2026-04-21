// ============================================================================
// File: apps/backend/src/services/audit/AuditService.ts
// Version: 1.0.0 — 2026-04-20
// Why: Append-only audit log writer. Every privileged action, data access,
//      and LLM call is recorded here. Logs are immutable — no update/delete
//      methods exist by design. Retention: 7 years (PIPEDA requirement).
//
//      Design decisions:
//        - Never throws (audit failure must NOT break the request)
//        - Logs errors to the logger instead of propagating them
//        - Uses the content schema (audit_logs table)
//        - actorId is a user ID string — NOT an email or name
//
// Env / Identity: Backend service (Node.js)
// ============================================================================

import type { AuditActorType, AuditResult } from '@imedica/shared';
import { Prisma } from '@prisma/client';

import { db } from '../../db/clients.js';
import { logger } from '../../lib/logger.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditEntry {
  actorType: AuditActorType;
  /** For user actors: user UUID. For system actors: service name. NOT an email. */
  actorId: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
  result: AuditResult;
}

// ─── AuditService ─────────────────────────────────────────────────────────────

export class AuditService {
  /**
   * Writes an audit log entry. Never throws — audit failures are logged
   * to the application logger but do not propagate to the caller.
   *
   * @example
   * await auditService.log({
   *   actorType: 'user',
   *   actorId: userId,
   *   action: 'user_login',
   *   resourceType: 'user',
   *   resourceId: userId,
   *   result: 'success',
   *   ipAddress: req.ip,
   *   userAgent: req.headers['user-agent'],
   * });
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await db.content.auditLog.create({
        data: {
          actorType: entry.actorType,
          actorId: entry.actorId ?? null,
          action: entry.action,
          resourceType: entry.resourceType ?? null,
          resourceId: entry.resourceId ?? null,
          metadata:
            entry.metadata === null || entry.metadata === undefined
              ? Prisma.JsonNull
              : (entry.metadata as Prisma.InputJsonValue),
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent?.substring(0, 500) ?? null, // Enforce DB field limit
          result: entry.result,
        },
      });
    } catch (error) {
      // NEVER throw from audit — log the failure and move on
      logger.error('Failed to write audit log entry', {
        error: error instanceof Error ? error.message : 'Unknown error',
        action: entry.action,
        actorId: entry.actorId,
      });
    }
  }

  /**
   * Convenience method for logging failed actions.
   * Combines log() call with consistent failure metadata.
   */
  async logFailure(
    entry: Omit<AuditEntry, 'result'>,
    error: unknown,
  ): Promise<void> {
    await this.log({
      ...entry,
      result: 'failure',
      metadata: {
        ...entry.metadata,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: error instanceof Error ? error.constructor.name : undefined,
      },
    });
  }

  /**
   * Bulk log multiple events (e.g., for batch operations).
   * All entries are written in parallel — partial failures do not block others.
   */
  async logBatch(entries: AuditEntry[]): Promise<void> {
    await Promise.allSettled(entries.map((e) => this.log(e)));
  }
}

// ─── Singleton Instance ───────────────────────────────────────────────────────
// Exported as a singleton for use in middleware and services without DI.
export const auditService = new AuditService();
