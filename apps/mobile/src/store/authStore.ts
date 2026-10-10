// ============================================================================
// File: apps/mobile/src/store/authStore.ts
// Why: Zustand store for authentication state on mobile.
//      Mirrors the web authStore, but persists tokens to SecureStore
//      instead of browser memory/cookies.
// ============================================================================

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  // ─── Login ──────────────────────────────────────────────────────────────────
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post<{
      success: boolean;
      data: { user: User; accessToken: string };
    }>('/api/auth/login', credentials);

    const { user, accessToken } = response.data.data;

    // Persist token securely on device
    await SecureStore.setItemAsync('accessToken', accessToken);

    set({ user, accessToken, isAuthenticated: true });
  },

  // ─── Logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Best-effort: clear local state even if server call fails
    }
    await SecureStore.deleteItemAsync('accessToken');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  // ─── Restore Session on App Launch ──────────────────────────────────────────
  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      // Verify token is still valid by fetching current user
      const response = await apiClient.get<{
        success: boolean;
        data: { user: User };
      }>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({
        user: response.data.data.user,
        accessToken: token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Token invalid or expired — clear and show login
      await SecureStore.deleteItemAsync('accessToken');
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
