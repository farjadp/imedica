// ============================================================================
// File: apps/web/src/lib/api-client.ts
// Version: 1.0.0 — 2026-04-22
// Why: Axios client for Imedica API calls with cookie support.
// Env / Identity: Web (browser runtime)
// ============================================================================

import axios, { isAxiosError } from 'axios';

import { getAccessToken } from './session.js';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const rejection = error instanceof Error ? error : new Error('Request failed');

    if (!isAxiosError(error)) {
      return Promise.reject(rejection);
    }

    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== '/api/auth/refresh' &&
      originalRequest.url !== '/api/auth/login'
    ) {
      originalRequest._retry = true;

      try {
        const { useAuthStore } = await import('@/features/auth/store/authStore.js');
        await useAuthStore.getState().refreshToken();
        const token = getAccessToken();

        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }

        return apiClient(originalRequest);
      } catch {
        const { useAuthStore } = await import('@/features/auth/store/authStore.js');
        await useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(new Error('Unauthorized request'));
      }
    }

    return Promise.reject(rejection);
  },
);
