// ============================================================================
// File: apps/web/src/features/admin/services/analyticsService.ts
// Version: 1.0.0 — 2026-04-24
// Why: API wrapper for Analytics operations.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { apiClient } from '@/lib/api-client.js';

export interface PlatformKPIs {
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  averageDurationSeconds: number;
  completionRate: number;
}

export interface TrendDataPoint {
  date: string;
  completed: number;
  abandoned: number;
}

export interface ScenarioPerformance {
  scenarioId: string;
  title: string;
  totalScore: number;
  count: number;
  maxScore: number;
  minScore: number;
  averageScore: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const analyticsService = {
  async getKPIs(): Promise<PlatformKPIs> {
    const response = await apiClient.get<ApiResponse<PlatformKPIs>>('/api/admin/analytics/kpi');
    return response.data.data;
  },

  async getTrends(days: number = 30): Promise<TrendDataPoint[]> {
    const response = await apiClient.get<ApiResponse<TrendDataPoint[]>>(`/api/admin/analytics/trends?days=${days}`);
    return response.data.data;
  },

  async getScenarioPerformance(): Promise<ScenarioPerformance[]> {
    const response = await apiClient.get<ApiResponse<ScenarioPerformance[]>>('/api/admin/analytics/scenarios');
    return response.data.data;
  },
};
