// ============================================================================
// File: apps/backend/src/db/clients.ts
// Version: 1.0.0 — 2026-04-20
// Why: Exports a single PrismaClient instance with namespaced accessors that
//      enforce the three-schema privacy boundary at the application layer.
//      Using db.identity.user vs db.analytics.session makes schema-crossing
//      violations immediately visible in code review.
//
//      RULES:
//        db.identity.*   — Use ONLY in: AuthService, DeidentificationService
//        db.analytics.*  — Use ONLY in: AnalyticsService, DeidentificationService
//        db.content.*    — Use freely for scenario/session/audit access
//
// Env / Identity: Backend (Node.js singleton)
// ============================================================================

import { PrismaClient } from '@prisma/client';

// ─── Singleton Prisma Client ──────────────────────────────────────────────────

// Prevent multiple instances in dev (Next.js/tsx hot reload creates new modules)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ─── Namespaced Database Accessors ───────────────────────────────────────────
// These accessors make schema-boundary violations obvious at development time.
// They do NOT enforce access at runtime — that's the application layer's job.

/**
 * Namespaced database accessors organized by privacy schema.
 *
 * @example
 * // In AuthService (allowed):
 * const user = await db.identity.user.findUnique({ where: { email } });
 *
 * // In AnalyticsService (allowed):
 * const sessions = await db.analytics.session.findMany({ where: { anonymousHash } });
 *
 * // NEVER do this (crosses privacy boundary):
 * // const user = await db.identity.user.findUnique(...)
 * // const session = await db.analytics.session.create({ data: { userId: user.id } })
 */
export const db = {
  /**
   * Identity schema — contains ALL PII.
   * Access restricted to: AuthService, DeidentificationService
   */
  identity: {
    user: prisma.user,
    organization: prisma.organization,
    /** CRITICAL: Only DeidentificationService should access this. */
    anonymousMapping: prisma.anonymousMapping,
    refreshToken: prisma.refreshToken,
  },

  /**
   * Analytics schema — anonymized data only. NO PII.
   * Access restricted to: AnalyticsService, DeidentificationService
   */
  analytics: {
    paramedicProfile: prisma.paramedicProfileSnapshot,
    session: prisma.analyticsSession,
    decision: prisma.decision,
  },

  /**
   * Content schema — scenarios, rules, templates, audit logs.
   * No user data — freely accessible for scenario delivery.
   */
  content: {
    scenario: prisma.scenario,
    scenarioState: prisma.scenarioState,
    scenarioRule: prisma.scenarioRule,
    feedbackTemplate: prisma.feedbackTemplate,
    session: prisma.session,
    sessionDecision: prisma.sessionDecision,
    auditLog: prisma.auditLog,
  },

  /**
   * Access the raw Prisma client for transactions or advanced queries.
   * Use sparingly — prefer the namespaced accessors above.
   */
  $transaction: prisma.$transaction.bind(prisma),
  $connect: prisma.$connect.bind(prisma),
  $disconnect: prisma.$disconnect.bind(prisma),
} as const;

export type Db = typeof db;

// Export the raw client for cases where it's truly needed (migrations, etc.)
export { prisma };
