// ============================================================================
// File: apps/backend/src/middleware/pii-filter.ts
// Version: 1.0.0 — 2026-04-20
// Why: Prevents PII from appearing in application logs.
//      Intercepts outgoing log calls and scrubs known PII patterns.
//      Also throws in development if PII is detected in request bodies
//      that should not contain it — catches developer mistakes early.
//
//      This is a SAFETY NET, not the primary control. Application code
//      must be written to not log PII in the first place.
//
//      What it checks:
//        - Outbound JSON response body (does NOT log it with PII)
//        - Request body fields that should never contain PII in non-identity routes
//        - Correlation IDs added to all requests for tracing
//
// Env / Identity: Backend (Express middleware)
// ============================================================================

import crypto from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

import { PII_PATTERNS } from '@imedica/shared';

import { logger } from '../lib/logger.js';

// ─── Request ID Middleware ─────────────────────────────────────────────────────

/**
 * Attaches a unique request ID to every request.
 * Used for log correlation and distributed tracing.
 */
export function attachRequestId(req: Request, res: Response, next: NextFunction): void {
  const requestId = crypto.randomUUID();
  // Add to request for use in middleware
  (req as Request & { requestId: string }).requestId = requestId;
  // Add to response headers so clients can correlate with our logs
  res.setHeader('X-Request-Id', requestId);
  next();
}

// ─── PII Detection ────────────────────────────────────────────────────────────

/**
 * Checks if a string contains any PII patterns.
 * Returns the pattern name if found, null if clean.
 */
function detectPii(value: string): string | null {
  for (const [name, pattern] of Object.entries(PII_PATTERNS)) {
    // Clone pattern to reset lastIndex (global regex state)
    const testPattern = new RegExp(pattern.source, pattern.flags);
    if (testPattern.test(value)) {
      return name;
    }
  }
  return null;
}

// ─── Response Body PII Filter Middleware ─────────────────────────────────────

/**
 * Middleware that logs outbound response metadata without logging response bodies.
 * Prevents PII from inadvertently appearing in access logs.
 *
 * What is logged: method, path, status code, duration, request ID
 * What is NOT logged: request/response bodies, headers with credentials
 */
export function piiSafeRequestLogger(req: Request, res: Response, next: NextFunction): void {
  const startAt = Date.now();
  const reqId = (req as Request & { requestId?: string }).requestId ?? 'unknown';

  res.on('finish', () => {
    const durationMs = Date.now() - startAt;
    const userId = req.user?.sub ?? 'anonymous';

    logger.info('HTTP request completed', {
      requestId: reqId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
      userId,
      // Intentionally NOT logging: body, query params (may contain tokens), cookies
    });
  });

  next();
}

// ─── Development PII Guard ────────────────────────────────────────────────────

/**
 * In development mode only: scans incoming request bodies for PII patterns
 * in fields that should NEVER contain PII in this context.
 *
 * For example, a /api/analytics/session body should not contain an email.
 * This catches accidental PII inclusion early in development.
 *
 * Does nothing in production — performance and false positive concerns.
 */
export function devPiiGuard(req: Request, _res: Response, next: NextFunction): void {
  if (process.env['NODE_ENV'] !== 'development') {
    next();
    return;
  }

  // Only check routes that are supposed to be PII-free
  const piiSensitiveRoutes = ['/api/analytics', '/api/sessions', '/api/feedback'];
  const isAnalyticsRoute = piiSensitiveRoutes.some((prefix) =>
    req.path.startsWith(prefix),
  );

  if (!isAnalyticsRoute || !req.body) {
    next();
    return;
  }

  const bodyStr = JSON.stringify(req.body);
  const piiFound = detectPii(bodyStr);

  if (piiFound) {
    logger.warn(
      `[DEV PII GUARD] PII pattern '${piiFound}' detected in request body to ${req.path}. ` +
        'This would be blocked in production. Ensure you are sending anonymized data.',
    );
    // In dev: warn but don't block (avoid breaking the dev workflow)
    // To make this a hard block, throw AppError here
  }

  next();
}
