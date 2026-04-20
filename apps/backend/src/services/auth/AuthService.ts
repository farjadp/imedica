// ============================================================================
// File: apps/backend/src/services/auth/AuthService.ts
// Version: 1.0.0 — 2026-04-20
// Why: Orchestrates all authentication flows: register, login, logout,
//      refresh, email verification, password reset.
//      Delegates token management to TokenService, email to EmailService,
//      and audit logging to AuditService.
//
//      Security decisions:
//        - bcrypt 12 rounds (~250ms per hash — deters brute force)
//        - Email verification required before login
//        - Password reset revokes ALL existing refresh tokens
//        - Login attempts don't reveal whether email exists
//        - Tokens are crypto-random (not UUID) to resist prediction
//
// Env / Identity: Backend service — reads/writes identity schema ONLY
// ============================================================================

import crypto from 'node:crypto';

import bcrypt from 'bcryptjs';

import { BCRYPT_ROUNDS, EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_SECONDS, PASSWORD_RESET_TOKEN_EXPIRES_IN_SECONDS } from '@imedica/shared';
import type { PublicUser, LoginResponse } from '@imedica/shared';

import { db } from '../../db/clients.js';
import {
  AccountDeletedError,
  EmailAlreadyRegisteredError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  NotFoundError,
  TokenInvalidError,
} from '../../lib/errors.js';
import { createChildLogger } from '../../lib/logger.js';
import type { RegisterDto, LoginDto } from '@imedica/shared';
import { AuditService } from '../audit/AuditService.js';
import { EmailService } from '../email/EmailService.js';
import { TokenService } from './TokenService.js';

const log = createChildLogger({ service: 'AuthService' });

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Maps a Prisma User to the public-safe type (no hash, no MFA secret). */
function toPublicUser(user: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  organizationId: string | null;
  emailVerified: boolean;
  consentAnalytics: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as PublicUser['role'],
    organizationId: user.organizationId,
    emailVerified: user.emailVerified,
    consentAnalytics: user.consentAnalytics,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

/** Generates a cryptographically random URL-safe token and its bcrypt hash. */
async function generateToken(): Promise<{ raw: string; hash: string }> {
  const raw = crypto.randomBytes(48).toString('base64url');
  const hash = await bcrypt.hash(raw, 10); // 10 rounds is fine for short-lived tokens
  return { raw, hash };
}

// ─── AuthService ──────────────────────────────────────────────────────────────

export class AuthService {
  constructor(
    private readonly tokens: TokenService,
    private readonly email: EmailService,
    private readonly audit: AuditService,
  ) {}

  // ─── Register ─────────────────────────────────────────────────────────────

  /**
   * Registers a new user, sends a verification email.
   * Does NOT automatically log the user in — verification required first.
   *
   * @throws EmailAlreadyRegisteredError if email is taken
   */
  async register(
    dto: RegisterDto,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    // Check for existing user (case-insensitive — email was lowercased by Zod)
    const existing = await db.identity.user.findUnique({
      where: { email: dto.email },
      select: { id: true, deletedAt: true },
    });

    if (existing) {
      // If account exists (even soft-deleted), return the same error to prevent enumeration
      await this.audit.log({
        actorType: 'system',
        actorId: null,
        action: 'user_register_duplicate_email',
        resourceType: 'user',
        resourceId: existing.id,
        result: 'failure',
        ipAddress: meta.ipAddress,
      });
      throw new EmailAlreadyRegisteredError();
    }

    // Hash the password (12 bcrypt rounds)
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Generate email verification token
    const { raw: verificationToken, hash: verificationTokenHash } = await generateToken();
    const verificationTokenExpiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_SECONDS * 1000,
    );

    // Create the user
    const user = await db.identity.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        organizationId: dto.organizationId ?? null,
        role: 'paramedic', // Default role — admins must be promoted manually
        consentAnalytics: dto.consentAnalytics,
        consentAnalyticsDate: dto.consentAnalytics ? new Date() : null,
        emailVerificationTokenHash: verificationTokenHash,
        emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
      },
      select: { id: true, firstName: true },
    });

    // Send verification email (non-blocking — email failure doesn't fail registration)
    void this.email.sendVerificationEmail({
      to: dto.email,
      firstName: user.firstName,
      token: verificationToken,
    });

    await this.audit.log({
      actorType: 'user',
      actorId: user.id,
      action: 'user_registered',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { consentAnalytics: dto.consentAnalytics },
    });

    log.info('User registered', { userId: user.id });

    return { message: 'Account created. Please check your email to verify your account.' };
  }

  // ─── Email Verification ───────────────────────────────────────────────────

  /**
   * Verifies the email verification token and marks the account as verified.
   *
   * @throws TokenInvalidError if token doesn't match or has expired
   */
  async verifyEmail(
    token: string,
    meta: { ipAddress?: string },
  ): Promise<{ message: string }> {
    // Find users with a pending verification token that hasn't expired
    const users = await db.identity.user.findMany({
      where: {
        emailVerified: false,
        emailVerificationTokenHash: { not: null },
        emailVerificationTokenExpiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        emailVerificationTokenHash: true,
      },
      take: 100, // Safety cap — realistically there won't be more than this
    });

    // Find the matching user by comparing token hashes
    let matchedUserId: string | null = null;
    for (const user of users) {
      if (
        user.emailVerificationTokenHash &&
        (await bcrypt.compare(token, user.emailVerificationTokenHash))
      ) {
        matchedUserId = user.id;
        break;
      }
    }

    if (!matchedUserId) {
      throw new TokenInvalidError();
    }

    // Mark as verified and clear the token
    await db.identity.user.update({
      where: { id: matchedUserId },
      data: {
        emailVerified: true,
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null,
      },
    });

    await this.audit.log({
      actorType: 'user',
      actorId: matchedUserId,
      action: 'user_email_verified',
      resourceType: 'user',
      resourceId: matchedUserId,
      result: 'success',
      ipAddress: meta.ipAddress,
    });

    log.info('Email verified', { userId: matchedUserId });
    return { message: 'Email verified successfully. You can now log in.' };
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  /**
   * Authenticates user credentials, returns access token + sets refresh token cookie.
   *
   * @throws InvalidCredentialsError for bad email/password (intentionally vague)
   * @throws EmailNotVerifiedError if account is unverified
   * @throws AccountDeletedError if account was soft-deleted
   */
  async login(
    dto: LoginDto,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<LoginResponse & { refreshToken: string; refreshTokenExpiresAt: Date }> {
    // Fetch user (includes deleted accounts for consistent timing)
    const user = await db.identity.user.findUnique({
      where: { email: dto.email },
    });

    // Always run bcrypt to prevent timing-oracle attacks
    const dummyHash = '$2b$12$dummy.hash.for.timing.consistency.padding.';
    const passwordToCheck = user?.passwordHash ?? dummyHash;
    const isValid = await bcrypt.compare(dto.password, passwordToCheck);

    if (!user || !isValid) {
      await this.audit.log({
        actorType: 'system',
        actorId: null,
        action: 'user_login_failed',
        resourceType: 'user',
        resourceId: null,
        result: 'failure',
        ipAddress: meta.ipAddress,
        metadata: { reason: !user ? 'user_not_found' : 'invalid_password' },
      });
      throw new InvalidCredentialsError();
    }

    if (user.deletedAt !== null) {
      throw new AccountDeletedError();
    }

    if (!user.emailVerified) {
      throw new EmailNotVerifiedError();
    }

    // Issue tokens
    const { token: accessToken, expiresAt } = this.tokens.signAccessToken({
      userId: user.id,
      role: user.role as PublicUser['role'],
      orgId: user.organizationId ?? undefined,
    });

    const { token: refreshToken, expiresAt: refreshTokenExpiresAt } =
      await this.tokens.createRefreshToken(user.id);

    // Update last login timestamp
    await db.identity.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.audit.log({
      actorType: 'user',
      actorId: user.id,
      action: 'user_login',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    log.info('User logged in', { userId: user.id, role: user.role });

    return {
      user: toPublicUser(user),
      accessToken,
      expiresAt,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────

  /**
   * Rotates the refresh token and issues a new access token.
   * The old refresh token is revoked (rotation prevents replay attacks).
   */
  async refreshTokens(
    oldRefreshToken: string,
    meta: { ipAddress?: string },
  ): Promise<{ accessToken: string; expiresAt: number; newRefreshToken: string; newRefreshTokenExpiresAt: Date }> {
    const { newToken, newTokenId: _newTokenId, userId, expiresAt: newRefreshExpiresAt } =
      await this.tokens.rotateRefreshToken(oldRefreshToken);

    const user = await db.identity.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true },
    });

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const { token: accessToken, expiresAt } = this.tokens.signAccessToken({
      userId,
      role: user.role as PublicUser['role'],
      orgId: user.organizationId ?? undefined,
    });

    await this.audit.log({
      actorType: 'user',
      actorId: userId,
      action: 'token_refreshed',
      resourceType: 'refresh_token',
      resourceId: null,
      result: 'success',
      ipAddress: meta.ipAddress,
    });

    return {
      accessToken,
      expiresAt,
      newRefreshToken: newToken,
      newRefreshTokenExpiresAt: newRefreshExpiresAt,
    };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  /**
   * Revokes the refresh token (the access token expires naturally after 15 min).
   */
  async logout(
    tokenId: string,
    userId: string,
    meta: { ipAddress?: string },
  ): Promise<{ message: string }> {
    await this.tokens.revokeToken(tokenId);

    await this.audit.log({
      actorType: 'user',
      actorId: userId,
      action: 'user_logout',
      resourceType: 'refresh_token',
      resourceId: tokenId,
      result: 'success',
      ipAddress: meta.ipAddress,
    });

    return { message: 'Logged out successfully.' };
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────

  /**
   * Sends a password reset email.
   * Always returns success — never reveals whether the email exists.
   */
  async forgotPassword(
    email: string,
    meta: { ipAddress?: string },
  ): Promise<{ message: string }> {
    const user = await db.identity.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, deletedAt: true },
    });

    // Always return success regardless of whether email exists
    const GENERIC_MESSAGE = 'If that email is registered, a reset link has been sent.';

    if (!user || user.deletedAt !== null) {
      // Log the attempt but don't reveal anything to the caller
      await this.audit.log({
        actorType: 'system',
        actorId: null,
        action: 'password_reset_requested_unknown_email',
        result: 'success',
        ipAddress: meta.ipAddress,
      });
      return { message: GENERIC_MESSAGE };
    }

    const { raw: resetToken, hash: resetTokenHash } = await generateToken();
    const resetTokenExpiresAt = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_EXPIRES_IN_SECONDS * 1000,
    );

    await db.identity.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: resetTokenHash,
        passwordResetTokenExpiresAt: resetTokenExpiresAt,
      },
    });

    void this.email.sendPasswordResetEmail({
      to: email,
      firstName: user.firstName,
      token: resetToken,
    });

    await this.audit.log({
      actorType: 'user',
      actorId: user.id,
      action: 'password_reset_requested',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
      ipAddress: meta.ipAddress,
    });

    return { message: GENERIC_MESSAGE };
  }

  // ─── Reset Password ───────────────────────────────────────────────────────

  /**
   * Validates the reset token and updates the password.
   * Also revokes ALL refresh tokens (forces re-authentication on all devices).
   *
   * @throws TokenInvalidError if token doesn't match or has expired
   */
  async resetPassword(
    token: string,
    newPassword: string,
    meta: { ipAddress?: string },
  ): Promise<{ message: string }> {
    // Find candidates with an active reset token
    const users = await db.identity.user.findMany({
      where: {
        passwordResetTokenHash: { not: null },
        passwordResetTokenExpiresAt: { gt: new Date() },
      },
      select: { id: true, passwordResetTokenHash: true },
      take: 100,
    });

    let matchedUserId: string | null = null;
    for (const user of users) {
      if (
        user.passwordResetTokenHash &&
        (await bcrypt.compare(token, user.passwordResetTokenHash))
      ) {
        matchedUserId = user.id;
        break;
      }
    }

    if (!matchedUserId) {
      throw new TokenInvalidError();
    }

    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password and clear reset token
    await db.identity.user.update({
      where: { id: matchedUserId },
      data: {
        passwordHash: newPasswordHash,
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null,
      },
    });

    // Revoke all refresh tokens (security: force re-login everywhere)
    await this.tokens.revokeAllForUser(matchedUserId);

    await this.audit.log({
      actorType: 'user',
      actorId: matchedUserId,
      action: 'password_reset_completed',
      resourceType: 'user',
      resourceId: matchedUserId,
      result: 'success',
      ipAddress: meta.ipAddress,
    });

    log.info('Password reset completed', { userId: matchedUserId });
    return { message: 'Password updated successfully. Please log in with your new password.' };
  }

  // ─── Get Current User ─────────────────────────────────────────────────────

  /** Returns the public profile of the authenticated user. */
  async getMe(userId: string): Promise<PublicUser> {
    const user = await db.identity.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return toPublicUser(user);
  }
}

// Factory function — use this instead of `new AuthService()` to wire dependencies
export function createAuthService(): AuthService {
  const { TokenService: TS } = require('./TokenService.js') as { TokenService: typeof TokenService };
  const { EmailService: ES } = require('../email/EmailService.js') as { EmailService: typeof EmailService };
  const { AuditService: AS } = require('../audit/AuditService.js') as { AuditService: typeof AuditService };
  return new AuthService(new TS(), new ES(), new AS());
}

// Singleton
import { tokenService } from './TokenService.js';
import { emailService } from '../email/EmailService.js';
import { auditService } from '../audit/AuditService.js';

export const authService = new AuthService(tokenService, emailService, auditService);
