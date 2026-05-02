// ============================================================================
// File: apps/web/src/features/auth/store/authStore.ts
// Version: 1.0.0 — 2026-04-22
// Why: Minimal auth store for the Phase 2 auth pages and future protected routing.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { create } from 'zustand';

import { clearAccessToken, setAccessToken as setSessionAccessToken } from '@/lib/session.js';

import {
  forgotPassword,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
  register as registerRequest,
  resetPassword,
  updateProfile,
  verifyEmail,
} from '../api/authApi.js';
import type { AuthUser, LoginFormValues, RegisterFormValues } from '../types.js';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
  register: (values: RegisterFormValues) => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  bootstrap: () => Promise<void>;
  forgotPassword: typeof forgotPassword;
  resetPassword: typeof resetPassword;
  verifyEmail: typeof verifyEmail;
  updateProfile: typeof updateProfile;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (values) => {
    const result = await loginRequest(values);
    setSessionAccessToken(result.accessToken);
    set({ user: result.user, accessToken: result.accessToken, isAuthenticated: true });
  },
  logout: async () => {
    try {
      await logoutRequest();
    } finally {
      clearAccessToken();
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },
  register: async (values) => {
    await registerRequest(values);
  },
  refreshToken: async () => {
    const session = await refreshSession();
    setSessionAccessToken(session.accessToken);
    set({ accessToken: session.accessToken });

    const user = await getCurrentUser();
    set({ user, isAuthenticated: true });
  },
  setUser: (user) => {
    set({ user, isAuthenticated: Boolean(user) });
  },
  setAccessToken: (accessToken) => {
    setSessionAccessToken(accessToken);
    set({ accessToken, isAuthenticated: Boolean(accessToken) });
  },
  bootstrap: async () => {
    set({ isLoading: true });
    try {
      await get().refreshToken();
      const user = await getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearAccessToken();
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },
  forgotPassword,
  resetPassword,
  verifyEmail,
  updateProfile,
}));
