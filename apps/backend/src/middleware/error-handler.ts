// ============================================================================
// File: apps/backend/src/middleware/error-handler.ts
// Version: 1.0.0 — 2026-04-20
// Why: Global Express error handler. Catches all errors propagated via next(err)
//      and returns a consistent ApiErrorResponse shape.
//      In production: strips internal details. In development: includes stack.
//      Logs to Sentry for non-operational errors (programming bugs).
// Env / Identity: Backend (Express middleware — MUST be last in middleware chain)
// ============================================================================

import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import type { ApiErrorResponse } from '@imedica/shared';

import { AppError, ValidationError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { captureError } from '../lib/sentry.js';

// ─── Error Handler ────────────────────────────────────────────────────────────

/**
 * Must be registered as the LAST middleware in the Express app:
 *   app.use(errorHandler);
 *
 * Express identifies error-handling middleware by the 4-argument signature.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isProd = process.env['NODE_ENV'] === 'production';
  const requestId = (req as Request & { requestId?: string }).requestId;

  // ─── Zod Validation Errors ────────────────────────────────────────────────
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const field = issue.path.join('.') || 'root';
      const existing = fieldErrors[field];
      if (existing) {
        existing.push(issue.message);
      } else {
        fieldErrors[field] = [issue.message];
      }
    }

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: isProd ? undefined : fieldErrors,
      },
      meta: { requestId, timestamp: new Date().toISOString() },
    };

    res.status(400).json(response);
    return;
  }

  // ─── Known Operational Errors ─────────────────────────────────────────────
  if (error instanceof AppError) {
    // Operational errors (auth, not found, etc.) — don't log to Sentry
    if (!error.isOperational) {
      // Programming errors (PII leakage, etc.) — log to Sentry
      captureError(error, {
        requestId,
        action: req.path,
      });
      logger.error('Non-operational error', {
        errorCode: error.code,
        message: error.message,
        path: req.path,
        stack: error.stack,
      });
    }

    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.isOperational
          ? error.message
          : 'An unexpected error occurred. Please try again.',
        details:
          !isProd && error instanceof ValidationError
            ? error.validationErrors
            : undefined,
      },
      meta: { requestId, timestamp: new Date().toISOString() },
    };

    res.status(error.statusCode).json(response);
    return;
  }

  // ─── Unknown Errors ───────────────────────────────────────────────────────
  // This shouldn't happen if all errors are wrapped in AppError.
  // Log aggressively and return a generic 500.
  captureError(error, { requestId, action: req.path });
  logger.error('Unhandled error', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    path: req.path,
    method: req.method,
  });

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      details: isProd
        ? undefined
        : error instanceof Error
          ? error.message
          : 'Unknown error',
    },
    meta: { requestId, timestamp: new Date().toISOString() },
  };

  res.status(500).json(response);
}

// ─── 404 Handler ─────────────────────────────────────────────────────────────

/** Catch-all for unmatched routes. Register before errorHandler. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(
    new AppError(
      `Route ${req.method} ${req.path} not found`,
      404,
      'ROUTE_NOT_FOUND',
    ),
  );
}
