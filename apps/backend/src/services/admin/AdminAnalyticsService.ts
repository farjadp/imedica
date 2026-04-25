// ============================================================================
// File: apps/backend/src/services/admin/AdminAnalyticsService.ts
// Version: 1.0.0 — 2026-04-24
// Why: Provides aggregated analytics reporting for the dashboard.
//      Only accesses the analytics schema and aggregates data securely.
// Env / Identity: Backend (Node.js Service)
// ============================================================================

import { db } from '../../db/clients.js';

export class AdminAnalyticsService {
  /**
   * Fetch high-level KPIs for the dashboard.
   */
  async getPlatformKPIs() {
    const totalSessions = await db.analytics.session.count();
    
    const completedSessions = await db.analytics.session.count({
      where: { status: 'completed' },
    });

    const aggregateStats = await db.analytics.session.aggregate({
      _avg: {
        finalScore: true,
        totalDurationSeconds: true,
      },
    });

    const completionRate = totalSessions > 0 
      ? Math.round((completedSessions / totalSessions) * 100) 
      : 0;

    return {
      totalSessions,
      completedSessions,
      averageScore: Math.round(aggregateStats._avg.finalScore || 0),
      averageDurationSeconds: Math.round(aggregateStats._avg.totalDurationSeconds || 0),
      completionRate,
    };
  }

  /**
   * Fetch session activity over the last N days.
   */
  async getSessionsOverTime(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await db.analytics.session.findMany({
      where: {
        startedAt: { gte: startDate },
      },
      select: {
        startedAt: true,
        status: true,
      },
    });

    const dateMap: Record<string, { date: string; completed: number; abandoned: number }> = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0] as string;
      dateMap[dateStr] = { date: dateStr, completed: 0, abandoned: 0 };
    }

    sessions.forEach((s: any) => {
      const dateStr = s.startedAt.toISOString().split('T')[0] as string;
      if (dateMap[dateStr]) {
        if (s.status === 'completed') {
          dateMap[dateStr]!.completed += 1;
        } else {
          dateMap[dateStr]!.abandoned += 1;
        }
      }
    });

    return Object.values(dateMap);
  }

  /**
   * Fetch performance broken down by Scenario.
   */
  async getScenarioPerformance() {
    const sessions = await db.analytics.session.findMany({
      where: { status: 'completed' },
      select: {
        scenarioId: true,
        finalScore: true,
        scenario: {
          select: { title: true },
        },
      },
    });

    const scenarioMap: Record<string, { scenarioId: string; title: string; totalScore: number; count: number; maxScore: number; minScore: number }> = {};

    sessions.forEach((s: any) => {
      if (!scenarioMap[s.scenarioId]) {
        scenarioMap[s.scenarioId] = {
          scenarioId: s.scenarioId,
          title: s.scenario.title,
          totalScore: 0,
          count: 0,
          maxScore: 0,
          minScore: 100,
        };
      }
      const mapItem = scenarioMap[s.scenarioId]!;
      const score = s.finalScore || 0;
      
      mapItem.totalScore += score;
      mapItem.count += 1;
      if (score > mapItem.maxScore) mapItem.maxScore = score;
      if (score < mapItem.minScore) mapItem.minScore = score;
    });

    const result = Object.values(scenarioMap).map(item => ({
      ...item,
      averageScore: Math.round(item.totalScore / item.count),
    }));

    return result.sort((a, b) => b.count - a.count);
  }
}

export const adminAnalyticsService = new AdminAnalyticsService();
