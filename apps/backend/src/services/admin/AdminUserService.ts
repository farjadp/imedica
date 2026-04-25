// ============================================================================
// File: apps/backend/src/services/admin/AdminUserService.ts
// Version: 1.0.0 — 2026-04-24
// Why: Provides administrative CRUD operations for User Management (Phase 6).
//      Ensures passwords are hashed and audit logs are recorded.
// Env / Identity: Backend (Node.js Service)
// ============================================================================

import type { UserRole } from '@imedica/shared';
import * as bcrypt from 'bcryptjs';

import { db } from '../../db/clients.js';
import { NotFoundError } from '../../lib/errors.js';
import { auditService } from '../audit/AuditService.js';
import { authService } from '../auth/AuthService.js';

export class AdminUserService {
  /**
   * Fetch all users (excluding password hashes and MFA secrets).
   * Includes soft-deleted users if needed, though usually we filter them out.
   */
  async getUsers(options?: { includeDeleted?: boolean }) {
    const whereClause = options?.includeDeleted ? {} : { deletedAt: null };

    const users = await db.identity.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        emailVerified: true,
        mfaEnabled: true,
        consentAnalytics: true,
        consentAnalyticsDate: true,
        createdAt: true,
        lastLoginAt: true,
        deletedAt: true,
      },
    });

    return users;
  }

  /**
   * Create a new user manually with a specified password.
   */
  async createUser(
    adminId: string,
    data: {
      email: string;
      passwordRaw: string;
      firstName: string | null;
      lastName: string | null;
      role: UserRole;
    },
    reqInfo: { ip: string | undefined; userAgent: string | undefined }
  ) {
    const passwordHash = await bcrypt.hash(data.passwordRaw, 12);

    const newUser = await db.identity.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        emailVerified: true, // Auto-verify since created by Admin
      },
    });

    await auditService.log({
      actorType: 'user',
      actorId: adminId,
      action: 'admin_user_created',
      resourceType: 'user',
      resourceId: newUser.id,
      result: 'success',
      metadata: { role: data.role, email: data.email },
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent,
    });

    return authService.getMe(newUser.id);
  }

  /**
   * Update a user's role.
   */
  async updateUserRole(
    adminId: string,
    userId: string,
    newRole: UserRole,
    reqInfo: { ip: string | undefined; userAgent: string | undefined }
  ) {
    const existing = await db.identity.user.findUnique({ where: { id: userId } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('User not found or deleted');
    }

    const updated = await db.identity.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    await auditService.log({
      actorType: 'user',
      actorId: adminId,
      action: 'admin_role_updated',
      resourceType: 'user',
      resourceId: userId,
      result: 'success',
      metadata: { oldRole: existing.role, newRole },
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent,
    });

    return authService.getMe(updated.id);
  }

  /**
   * Soft delete a user by setting deletedAt.
   */
  async deleteUser(
    adminId: string,
    userId: string,
    reqInfo: { ip: string | undefined; userAgent: string | undefined }
  ) {
    const existing = await db.identity.user.findUnique({ where: { id: userId } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('User not found or already deleted');
    }

    const deletedUser = await db.identity.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    await auditService.log({
      actorType: 'user',
      actorId: adminId,
      action: 'admin_user_deleted',
      resourceType: 'user',
      resourceId: userId,
      result: 'success',
      metadata: { role: existing.role },
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent,
    });

    return authService.getMe(deletedUser.id);
  }
}

export const adminUserService = new AdminUserService();
