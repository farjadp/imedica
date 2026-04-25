// ============================================================================
// File: apps/web/src/features/admin/services/userService.ts
// Version: 1.0.0 — 2026-04-24
// Why: API wrapper for User Management operations.
// Env / Identity: Web (browser runtime)
// ============================================================================

import type { PublicUser, UserRole } from '@imedica/shared';

import { apiClient } from '@/lib/api-client.js';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const userService = {
  async getUsers(): Promise<PublicUser[]> {
    const response = await apiClient.get<ApiResponse<PublicUser[]>>('/api/admin/users');
    return response.data.data;
  },

  async createUser(data: { email: string; passwordRaw: string; firstName: string | null; lastName: string | null; role: UserRole }): Promise<PublicUser> {
    const response = await apiClient.post<ApiResponse<PublicUser>>('/api/admin/users', {
      email: data.email,
      password: data.passwordRaw,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    });
    return response.data.data;
  },

  async updateUserRole(userId: string, role: UserRole): Promise<PublicUser> {
    const response = await apiClient.patch<ApiResponse<PublicUser>>(`/api/admin/users/${userId}/role`, {
      role,
    });
    return response.data.data;
  },

  async deleteUser(userId: string): Promise<PublicUser> {
    const response = await apiClient.delete<ApiResponse<PublicUser>>(`/api/admin/users/${userId}`);
    return response.data.data;
  },
};
