// ============================================================================
// File: apps/web/src/lib/session.ts
// Version: 1.0.0 — 2026-04-22
// Why: In-memory access token holder for API request headers.
// Env / Identity: Web (browser runtime)
// ============================================================================

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}
