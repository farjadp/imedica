// ============================================================================
// File: apps/backend/src/routes/auth.ts
// Version: 1.0.0 — 2026-04-20
// Why: All authentication endpoints. Validates requests with Zod schemas before
//      touching the service layer. Sets/clears the httpOnly refresh token cookie.
//      Follows RESTish conventions but auth is a special case — POST for everything.
// Env / Identity: Backend (Express router)
// ============================================================================

import type { AccessTokenPayload, ApiResponse } from '@imedica/shared';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
} from '@imedica/shared';
import type { NextFunction, Request, Response, Router as ExpressRouter } from 'express';
import { Router } from 'express';

import { authenticate } from '../middleware/auth.js';
import { loginLimiter, passwordResetLimiter, registerLimiter } from '../middleware/rate-limit.js';
import { authService } from '../services/auth/AuthService.js';

const router: ExpressRouter = Router();

// ─── POST /api/auth/register ─────────────────────────────────────────────────

router.post('/register', registerLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = RegisterSchema.parse(req.body);
    const result = await authService.register(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    const response: ApiResponse<typeof result> = { success: true, data: result };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = LoginSchema.parse(req.body);
    const result = await authService.login(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Set refresh token in httpOnly cookie — not returned in response body
    const cookieOptions = {
      ...REFRESH_TOKEN_COOKIE_OPTIONS,
      // Allow non-HTTPS in development
      secure: process.env['NODE_ENV'] === 'production',
    };
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, cookieOptions);

    const { refreshToken: _rt, refreshTokenExpiresAt: _rtExp, ...responseData } = result;

    const response: ApiResponse<typeof responseData> = { success: true, data: responseData };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as AccessTokenPayload | undefined;

    // Get refresh token ID from cookie to revoke it
    const refreshTokenRaw: unknown = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    // Attempt to get the token ID from the JWT in the cookie
    let tokenId = 'unknown';
    if (typeof refreshTokenRaw === 'string') {
      try {
        // Quick base64 decode of the payload to get tokenId without verifying signature
        // (we're revoking it anyway — security is in removing it from DB)
        const [, payloadB64] = refreshTokenRaw.split('.');
        if (payloadB64) {
          const payload = JSON.parse(
            Buffer.from(payloadB64, 'base64url').toString('utf-8'),
          ) as { tokenId?: string };
          tokenId = payload.tokenId ?? 'unknown';
        }
      } catch {
        // Ignore decode failures
      }
    }

    const result = await authService.logout(tokenId, user!.sub, {
      ipAddress: req.ip,
    });

    // Clear the refresh token cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: '/api/auth' });

    const response: ApiResponse<typeof result> = { success: true, data: result };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshTokenRaw: unknown = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (typeof refreshTokenRaw !== 'string' || !refreshTokenRaw) {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_MISSING', message: 'No refresh token present' },
      });
      return;
    }

    const result = await authService.refreshTokens(refreshTokenRaw, {
      ipAddress: req.ip,
    });

    // Set the new refresh token cookie
    const cookieOptions = {
      ...REFRESH_TOKEN_COOKIE_OPTIONS,
      secure: process.env['NODE_ENV'] === 'production',
    };
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.newRefreshToken, cookieOptions);

    const { newRefreshToken: _nrt, newRefreshTokenExpiresAt: _exp, ...responseData } = result;

    const response: ApiResponse<typeof responseData> = { success: true, data: responseData };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/verify-email ─────────────────────────────────────────────

router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = VerifyEmailSchema.parse(req.body);
    const result = await authService.verifyEmail(token, { ipAddress: req.ip });
    const response: ApiResponse<typeof result> = { success: true, data: result };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────

router.post('/forgot-password', passwordResetLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(email, { ipAddress: req.ip });
    const response: ApiResponse<typeof result> = { success: true, data: result };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────

router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = ResetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(token, newPassword, {
      ipAddress: req.ip,
    });
    // Clear refresh token cookie — force re-login after password reset
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: '/api/auth' });
    const response: ApiResponse<typeof result> = { success: true, data: result };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = req.user as AccessTokenPayload | undefined;
    const user = await authService.getMe(authUser!.sub);
    const response: ApiResponse<typeof user> = { success: true, data: user };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
