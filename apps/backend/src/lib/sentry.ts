// ============================================================================
// File: apps/backend/src/lib/sentry.ts
// Version: 1.0.0 — 2026-04-20
// Why: Centralizes Sentry initialization and provides a helper for capturing
//      errors with request context. Only initializes if SENTRY_DSN is set
//      (can be left empty in local dev).
//      IMPORTANT: Sentry is configured to scrub sensitive data (PII filter)
//      before sending. We do NOT send user email/name in Sentry contexts.
// Env / Identity: Backend (Node.js)
// ============================================================================

import * as Sentry from '@sentry/node';

import { logger } from './logger.js';

// ─── Initialization ───────────────────────────────────────────────────────────

/**
 * Initializes Sentry. Called once at app startup from src/index.ts.
 * No-ops if SENTRY_DSN is not set (local dev friendly).
 */
export function initSentry(dsn: string | undefined, env: string): void {
  if (!dsn) {
    logger.info('Sentry DSN not configured — error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: env,
    // Sample 100% of errors, 5% of transactions
    tracesSampleRate: env === 'production' ? 0.05 : 1.0,
    // PII scrubbing — do NOT send user identifiers or PII to Sentry
    beforeSend(event) {
      // Strip user object (contains email) — we track by anonymous ID only
      if (event.user) {
        event.user = {
          id: event.user.id, // Keep anonymous session ID if present
        };
      }
      // Remove sensitive request headers
      if (event.request?.headers) {
        const safeHeaders = { ...event.request.headers };
        delete safeHeaders['authorization'];
        delete safeHeaders['cookie'];
        event.request.headers = safeHeaders;
      }
      return event;
    },
    // Remove PII from breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.data?.['url']) {
        // Strip query params that might contain tokens
        try {
          const url = new URL(String(breadcrumb.data['url']));
          url.search = '';
          breadcrumb.data['url'] = url.toString();
        } catch {
          // Not a valid URL — leave as is
        }
      }
      return breadcrumb;
    },
  });

  logger.info('Sentry initialized', { env });
}

// ─── Error Capture Helpers ────────────────────────────────────────────────────

/**
 * Captures an exception with additional context.
 * Use this instead of Sentry.captureException directly.
 */
export function captureError(
  error: unknown,
  context?: {
    userId?: string;      // Anonymous user ID (NOT email or name)
    requestId?: string;
    action?: string;
    extra?: Record<string, unknown>;
  },
): void {
  Sentry.withScope((scope) => {
    if (context?.userId) {
      // Set anonymous user ID only — never email or name
      scope.setUser({ id: context.userId });
    }
    if (context?.requestId) {
      scope.setTag('requestId', context.requestId);
    }
    if (context?.action) {
      scope.setTag('action', context.action);
    }
    if (context?.extra) {
      scope.setExtras(context.extra);
    }
    Sentry.captureException(error);
  });
}

export { Sentry };
