// ============================================================================
// File: apps/web/src/features/admin/pages/AnalyticsDashboardPage.tsx
// Version: 1.0.0 — 2026-04-24
// Why: Dashboard for administrators to view aggregated platform performance.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Badge, Button, Card } from '@imedica/ui';
import { useQuery } from '@tanstack/react-query';
import { Activity, BarChart3, ChevronLeft, Clock, Target, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useAuthStore } from '@/features/auth/store/authStore.js';
import { analyticsService } from '../services/analyticsService.js';

const ALLOWED_ROLES = ['admin', 'super_admin', 'clinical_validator'];

function AccessDenied(): JSX.Element {
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <Card variant="outlined" padding="lg" className="w-full">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error-50 text-error-600 dark:bg-error-900/30 dark:text-error-300">
            <Activity className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-text-subtle">
              Restricted workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-text">Access Denied</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
              You must be an Administrator or Clinical Validator to access analytical data.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="primary" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </Button>
        </div>
      </Card>
    </main>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AnalyticsDashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const hasAccess = currentUser?.role && ALLOWED_ROLES.includes(currentUser.role);
  const [days, setDays] = useState(30);

  // Queries
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['admin-analytics-kpi'],
    queryFn: () => analyticsService.getKPIs(),
    enabled: !!hasAccess,
  });

  const { data: trends = [], isLoading: trendsLoading } = useQuery({
    queryKey: ['admin-analytics-trends', days],
    queryFn: () => analyticsService.getTrends(days),
    enabled: !!hasAccess,
  });

  const { data: scenarios = [], isLoading: scenariosLoading } = useQuery({
    queryKey: ['admin-analytics-scenarios'],
    queryFn: () => analyticsService.getScenarioPerformance(),
    enabled: !!hasAccess,
  });

  // Derived
  const formattedTrends = useMemo(() => {
    return trends.map(t => ({
      ...t,
      // Short date format for charts
      formattedDate: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  }, [trends]);

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-border pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-text-subtle">
              <Activity className="h-4 w-4" />
              <span className="uppercase tracking-widest">Analytics Workspace</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-text">System Analytics</h1>
            <p className="text-lg text-text-muted">Monitor key performance indicators and overall system health.</p>
          </div>

          <div className="flex flex-wrap gap-3">
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <Card variant="outlined" padding="md" className="relative overflow-hidden group bg-surface-muted/30 hover:bg-surface-muted/50 border-border/60 transition shadow-none">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-text-muted mb-1">Total Sessions</p>
                <h3 className="text-3xl font-semibold text-text">
                  {kpiLoading ? '...' : kpis?.totalSessions.toLocaleString() || '0'}
                </h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-xs text-text-subtle">
              Across all available scenarios
            </div>
          </Card>

          <Card variant="outlined" padding="md" className="relative overflow-hidden group bg-surface-muted/30 hover:bg-surface-muted/50 border-border/60 transition shadow-none">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-text-muted mb-1">Average Score</p>
                <h3 className="text-3xl font-semibold text-text">
                  {kpiLoading ? '...' : `${kpis?.averageScore || 0}%`}
                </h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-600 dark:bg-success-900/30">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-xs text-text-subtle">
              Global baseline across all attempts
            </div>
          </Card>

          <Card variant="outlined" padding="md" className="relative overflow-hidden group bg-surface-muted/30 hover:bg-surface-muted/50 border-border/60 transition shadow-none">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-text-muted mb-1">Completion Rate</p>
                <h3 className="text-3xl font-semibold text-text">
                  {kpiLoading ? '...' : `${kpis?.completionRate || 0}%`}
                </h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-50 text-info-600 dark:bg-info-900/30">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-xs text-text-subtle">
              Sessions that reach a final state
            </div>
          </Card>

          <Card variant="outlined" padding="md" className="relative overflow-hidden group bg-surface-muted/30 hover:bg-surface-muted/50 border-border/60 transition shadow-none">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-text-muted mb-1">Avg Duration</p>
                <h3 className="text-3xl font-semibold text-text">
                  {kpiLoading ? '...' : formatDuration(kpis?.averageDurationSeconds || 0)}
                </h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-50 text-warning-600 dark:bg-warning-900/30">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-xs text-text-subtle">
              Active time per session
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Trend Chart */}
          <Card variant="outlined" padding="md" className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text">Activity Trends</h2>
                <p className="text-sm text-text-muted">Completed vs Abandoned sessions over time</p>
              </div>
              <select 
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text focus:border-primary-500 focus:outline-none"
              >
                <option value={7}>Last 7 Days</option>
                <option value={14}>Last 14 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
              </select>
            </div>
            
            <div className="h-72 w-full">
              {trendsLoading ? (
                <div className="flex h-full items-center justify-center text-text-muted">Loading chart data...</div>
              ) : formattedTrends.length === 0 ? (
                <div className="flex h-full items-center justify-center text-text-muted">No activity data for this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAbandoned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                    <XAxis 
                      dataKey="formattedDate" 
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                      tickMargin={10}
                      axisLine={false}
                      className="text-text-subtle"
                    />
                    <YAxis 
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      className="text-text-subtle"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-text)' }}
                      itemStyle={{ color: 'var(--color-text)' }}
                    />
                    <Area type="monotone" dataKey="completed" name="Completed" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                    <Area type="monotone" dataKey="abandoned" name="Abandoned" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorAbandoned)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Scenarios Table */}
          <div className="flex flex-col rounded-2xl border border-border overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-text">Scenario Performance</h2>
              <p className="text-sm text-text-muted">Top scenarios by attempt volume</p>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-muted sticky top-0">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                    <th className="px-5 py-3">Scenario</th>
                    <th className="px-5 py-3 text-right">Avg Score</th>
                    <th className="px-5 py-3 text-right">Attempts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {scenariosLoading ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-sm text-text-muted">Loading scenarios...</td>
                    </tr>
                  ) : scenarios.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-sm text-text-muted">No scenarios played yet.</td>
                    </tr>
                  ) : (
                    scenarios.map((scenario) => (
                      <tr key={scenario.scenarioId} className="transition hover:bg-surface-muted">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-text truncate max-w-[180px]" title={scenario.title}>
                            {scenario.title}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Badge variant={scenario.averageScore >= 80 ? 'success' : scenario.averageScore >= 60 ? 'warning' : 'error'}>
                            {scenario.averageScore}%
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right text-sm text-text-muted">
                          {scenario.count}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
    </div>
  );
}
