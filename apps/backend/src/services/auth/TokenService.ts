// ============================================================================
// File: apps/backend/src/services/auth/TokenService.ts
// Version: 1.0.0 — 2026-04-20
// Why: Manages all JWT operations (sign, verify, rotate).
//      Encapsulates token logic so AuthService doesn't need to know about
//      JWT internals. Refresh tokens are stored as bcrypt hashes in the DB
//      to prevent token theft from a compromised database.
//
//      Token lifecycle:
//        - Access token: signed JWT, 15 min, Bearer header
//        - Refresh token: signed JWT, 7 days, httpOnly cookie
//          → hash stored in refresh_tokens table
//          → rotated on every use (old revoked, new issued)
//          → all revoked on password change
//
// Env / Identity: Backend service — reads identity schema (refresh_tokens)
// ============================================================================

import crypto from 'node:crypto';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  BCRYPT_ROUNDS,
  REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} from '@imedica/shared';
import type { AccessTokenPayload, RefreshTokenPayload, UserRole } from '@imedica/shared';

import { db } from '../../db/clients.js';
import {
  TokenExpiredError,
  TokenInvalidError,
} from '../../lib/errors.js';
import { createChildLogger } from '../../lib/logger.js';
import { env } from '../../lib/validate-env.js';

const log = createChildLogger({ service: 'TokenService' });

// ─── TokenService ─────────────────────────────────────────────────────────────

export class TokenService {
  // ─── Access Token ─────────────────────────────────────────────────────────

  /**
   * Signs and returns a short-lived access token (15 min).
   * Sent in Authorization: Bearer header — NOT in a cookie.
   */
  signAccessToken(payload: {
    userId: string;
    role: UserRole;
    orgId: string | undefined;
  }): { token: string; expiresAt: number } {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + ACCESS_TOKEN_EXPIRES_IN_SECONDS;

    const jwtPayload: AccessTokenPayload = {
      sub: payload.userId,
      role: payload.role,
      orgId: payload.orgId,
      iat,
      exp,
    };

    const token = jwt.sign(jwtPayload, env().JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
    });

    return { token, expiresAt: exp * 1000 }; // Return expiresAt in milliseconds
  }

  /**
   * Verifies an access token and returns the decoded payload.
   *
   * @throws TokenExpiredError if the token has expired
   * @throws TokenInvalidError if the token is malformed or has bad signature
   */
  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(token, env().JWT_ACCESS_SECRET, {
        algorithms: ['HS256'],
      }) as AccessTokenPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError();
      }
      log.debug('Access token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw new TokenInvalidError();
    }
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────

  /**
   * Creates a new refresh token, stores its hash in the DB, and returns
   * the plaintext token for setting in the httpOnly cookie.
   *
   * Rotation strategy: each refresh creates a new DB row. The old row is
   * revoked when this new token is used. See rotateRefreshToken().
   */
  async createRefreshToken(userId: string): Promise<{
    token: string;
    tokenId: string;
    expiresAt: Date;
  }> {
    const tokenId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000);

    // Sign the JWT refresh token
    const jwtPayload: RefreshTokenPayload = {
      sub: userId,
      tokenId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const token = jwt.sign(jwtPayload, env().JWT_REFRESH_SECRET, {
      algorithm: 'HS256',
    });

    // Store only the hash in the DB (prevents DB theft attacks)
    const tokenHash = await bcrypt.hash(token, BCRYPT_ROUNDS);

    await db.identity.refreshToken.create({
      data: {
        id: tokenId,
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { token, tokenId, expiresAt };
  }

  /**
   * Rotates a refresh token: verifies the current token, revokes it, and issues a new one.
   *
   * @returns New token pair
   * @throws TokenExpiredError if the token has expired
   * @throws TokenInvalidError if the token is invalid or already revoked
   */
  async rotateRefreshToken(
    oldTokenRaw: string,
  ): Promise<{ newToken: string; newTokenId: string; userId: string; expiresAt: Date }> {
    // Step 1: Decode the JWT to extract tokenId (without verifying yet — we need the DB record)
    let payload: RefreshTokenPayload;
    try {
      payload = jwt.verify(oldTokenRaw, env().JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
      }) as RefreshTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) throw new TokenExpiredError();
      throw new TokenInvalidError();
    }

    // Step 2: Fetch the DB record
    const dbToken = await db.identity.refreshToken.findUnique({
      where: { id: payload.tokenId },
    });

    if (!dbToken) {
      log.warn('Refresh token not found in DB — possible reuse attack', {
        tokenId: payload.tokenId,
      });
      // Revoke ALL tokens for this user as a security precaution
      await this.revokeAllForUser(payload.sub);
      throw new TokenInvalidError();
    }

    // Step 3: Check for revocation
    if (dbToken.revokedAt !== null) {
      log.warn('Revoked refresh token used — possible theft', {
        tokenId: payload.tokenId,
        userId: payload.sub,
      });
      // Revoke ALL tokens for this user (they may be compromised)
      await this.revokeAllForUser(payload.sub);
      throw new TokenInvalidError();
    }

    // Step 4: Check expiry
    if (dbToken.expiresAt < new Date()) {
      throw new TokenExpiredError();
    }

    // Step 5: Verify the hash matches (prevents DB record but token stolen attacks)
    const hashMatches = await bcrypt.compare(oldTokenRaw, dbToken.tokenHash);
    if (!hashMatches) {
      log.warn('Refresh token hash mismatch — possible forgery', {
        tokenId: payload.tokenId,
      });
      throw new TokenInvalidError();
    }

    // Step 6: Revoke old token and issue new one (rotation)
    await db.identity.refreshToken.update({
      where: { id: payload.tokenId },
      data: { revokedAt: new Date() },
    });

    const { token: newToken, tokenId: newTokenId, expiresAt } =
      await this.createRefreshToken(payload.sub);

    return {
      newToken,
      newTokenId,
      userId: payload.sub,
      expiresAt,
    };
  }

  /**
   * Revokes a single refresh token by its ID.
   * Called on logout.
   */
  async revokeToken(tokenId: string): Promise<void> {
    await db.identity.refreshToken.updateMany({
      where: { id: tokenId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revokes ALL refresh tokens for a user.
   * Called on: password change, account compromise, admin force-logout.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await db.identity.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    log.info('All refresh tokens revoked for user', { userId });
  }

  /**
   * Purges expired and revoked refresh tokens for a user.
   * Called periodically by a maintenance job.
   */
  async purgeExpiredTokens(): Promise<number> {
    const result = await db.identity.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });
    return result.count;
  }
}

// Singleton instance
export const tokenService = new TokenService();
