// ============================================================================
// File: apps/web/src/lib/api.ts
// Version: 1.0.0 — 2026-04-20
// Why: Standardized configured Axios instance for the MVP backend.
//      Includes withCredentials to pass the HttpOnly refresh token cookie.
// Env / Identity: Web (React — runs in browser)
// ============================================================================

import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Crucial for refresh tokens and auth cookies
});

// We can add interceptors for automatic token refresh later,
// but for this MVP vertical slice we will keep it simple.
