// ============================================================================
// File: apps/backend/src/middleware/audit-log.ts
// Version: 1.0.0 — 2026-04-20
// Why: Automatic audit logging for every API request.
//      More detailed than access logs — includes the authenticated actor,
//      action inferred from method+path, and request outcome.
//      Works in tandem with AuditService.log() which services call manually
//      for business-level events. This covers infrastructure-level access.
// Env / Identity: Backend (Express middleware)
// ============================================================================

import type { AccessTokenPayload } from '@imedica/shared';
import type { NextFunction, Request, Response } from 'express';

import { auditService } from '../services/audit/AuditService.js';

// ─── Route → Action Mapping ───────────────────────────────────────────────────

/**
 * Maps HTTP method + path pattern to a human-readable action string for the audit log.
 * More specific patterns must come before more general ones.
 */
const ACTION_MAP: { method: string; pattern: RegExp; action: string }[] = [
  { method: 'POST', pattern: /^\/api\/auth\/register$/, action: 'auth.register_attempt' },
  { method: 'POST', pattern: /^\/api\/auth\/login$/, action: 'auth.login_attempt' },
  { method: 'POST', pattern: /^\/api\/auth\/logout$/, action: 'auth.logout' },
  { method: 'POST', pattern: /^\/api\/auth\/refresh$/, action: 'auth.token_refresh' },
  { method: 'POST', pattern: /^\/api\/auth\/verify-email$/, action: 'auth.email_verify' },
  { method: 'POST', pattern: /^\/api\/auth\/forgot-password$/, action: 'auth.forgot_password' },
  { method: 'POST', pattern: /^\/api\/auth\/reset-password$/, action: 'auth.reset_password' },
  { method: 'GET', pattern: /^\/api\/auth\/me$/, action: 'auth.get_me' },
  { method: 'GET', pattern: /^\/api\/scenarios/, action: 'scenario.read' },
  { method: 'POST', pattern: /^\/api\/sessions/, action: 'session.write' },
  { method: 'GET', pattern: /^\/api\/admin/, action: 'admin.access' },
];

function inferAction(method: string, path: string): string {
  for (const mapping of ACTION_MAP) {
    if (mapping.method === method && mapping.pattern.test(path)) {
      return mapping.action;
    }
  }
  return `http.${method.toLowerCase()}.${path.replace(/\//g, '_')}`;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Writes an audit log entry for every request after the response is sent.
 * Does NOT block the request — fires on the 'finish' event.
 *
 * Note: Business-level audit events (user_registered, password_changed) are
 * written by the service layer with richer context. This middleware covers
 * the access-level audit trail.
 */
export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    const user = req.user as AccessTokenPayload | undefined;
    const userId = user?.sub ?? null;
    const action = inferAction(req.method, req.path);
    const result = res.statusCode < 400 ? 'success' : 'failure';

    // Fire-and-forget — do not await
    void auditService.log({
      actorType: userId ? 'user' : 'system',
      actorId: userId,
      action,
      resourceType: 'http_request',
      resourceId: null,
      metadata: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        requestId: (req as Request & { requestId?: string }).requestId,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      result,
    });
  });

  next();
}
