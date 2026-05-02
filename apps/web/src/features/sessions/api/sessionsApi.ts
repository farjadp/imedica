// ============================================================================
// File: apps/web/src/features/sessions/api/sessionsApi.ts
// Version: 1.0.0 — 2026-04-24
// Why: API helpers for runtime session review and enhanced feedback polling.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { apiClient } from '@/lib/api-client.js';

import type { EnhancedFeedbackStatus, SessionLoadPayload } from '../types.js';

export async function getSession(sessionId: string): Promise<SessionLoadPayload> {
  const response = await apiClient.get<{ success: true; data: SessionLoadPayload }>(`/api/sessions/${sessionId}`);
  return response.data.data;
}

export async function getEnhancedFeedbackStatus(sessionId: string): Promise<EnhancedFeedbackStatus> {
  const response = await apiClient.get<EnhancedFeedbackStatus>(`/api/sessions/${sessionId}/enhanced-feedback-status`);
  return response.data;
}
