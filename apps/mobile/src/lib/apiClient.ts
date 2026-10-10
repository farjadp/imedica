// ============================================================================
// File: apps/mobile/src/lib/apiClient.ts
// Why: Axios instance pre-configured with the backend base URL.
//      Automatically attaches the access token from SecureStore to every
//      authenticated request, mirroring the web apiClient behaviour.
// ============================================================================

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'                   // Local dev backend
  : 'https://imedica-backend.vercel.app';     // Production backend

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Mobile sends cookies through headers manually (no browser cookie jar)
  withCredentials: false,
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Attach stored access token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor ────────────────────────────────────────────────────
// Handle 401 by clearing local session (token refresh will be Phase 2)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('accessToken');
    }
    return Promise.reject(error);
  },
);
