// ============================================================================
// File: apps/backend/src/middleware/auth.ts
// Version: 1.0.0 — 2026-04-20
// Why: JWT authentication and role-based authorization middleware.
//      Reads the Bearer token from the Authorization header, verifies it,
//      and attaches the decoded payload to req.user.
//      Error messages are intentionally generic — don't reveal token details.
// Env / Identity: Backend (Express middleware)
// ============================================================================

import type { UserRole } from '@imedica/shared';
import type { NextFunction, Request, Response } from 'express';

import { AuthenticationError, ForbiddenError } from '../lib/errors.js';
import { tokenService } from '../services/auth/TokenService.js';

// ─── authenticate middleware ──────────────────────────────────────────────────

/**
 * Verifies the JWT access token from the Authorization: Bearer <token> header.
 * Attaches the decoded payload to `req.user`.
 *
 * @throws AuthenticationError (401) if token is missing, expired, or invalid
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AuthenticationError());
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    req.user = tokenService.verifyAccessToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

// ─── authorize middleware factory ─────────────────────────────────────────────

/**
 * Role-based authorization middleware. Must be used AFTER `authenticate`.
 *
 * @param roles - One or more roles that are allowed to access the route.
 *
 * @example
 * router.get('/admin/users', authenticate, authorize('admin', 'super_admin'), handler);
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError());
      return;
    }

    next();
  };
}

// ─── optionalAuthenticate middleware ─────────────────────────────────────────

/**
 * Like `authenticate` but does not throw if token is missing.
 * Use for routes that behave differently for authenticated vs anonymous users.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    req.user = tokenService.verifyAccessToken(token);
  } catch {
    // Silently ignore — user remains unauthenticated
  }

  next();
}
