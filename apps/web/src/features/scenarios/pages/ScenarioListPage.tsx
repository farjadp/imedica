// ============================================================================
// File: apps/web/src/features/scenarios/pages/ScenarioListPage.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Physician-only scenario library and management surface for Phase 3.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Badge, Button, Card, Input } from '@imedica/ui';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Filter,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/authStore.js';
import { cn } from '@/lib/cn.js';

import { mockScenarios } from '../data/mockScenarios.js';
import {
  SCENARIO_CATEGORY_META,
  SCENARIO_DIFFICULTY_LABELS,
  SCENARIO_DIFFICULTY_VARIANTS,
  SCENARIO_SORT_OPTIONS,
  SCENARIO_STATUS_LABELS,
  SCENARIO_STATUS_VARIANTS,
  type ScenarioCategory,
  type ScenarioDifficulty,
  type ScenarioSortKey,
  type ScenarioStatus,
  type ScenarioSummary,
} from '../types.js';

const PAGE_SIZE = 20;
const ALLOWED_ROLES = ['admin', 'super_admin', 'clinical_validator'] as const;

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const diffDays = Math.max(0, Math.round((now - date.getTime()) / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function getDifficultyBadgeVariant(difficulty: ScenarioDifficulty): 'success' | 'warning' | 'error' {
  return SCENARIO_DIFFICULTY_VARIANTS[difficulty];
}

function getStatusBadgeVariant(status: ScenarioStatus): 'neutral' | 'warning' | 'success' | 'error' {
  return SCENARIO_STATUS_VARIANTS[status];
}

function AccessDenied(): JSX.Element {
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <Card variant="outlined" padding="lg" className="w-full">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error-50 text-error-600 dark:bg-error-900/30 dark:text-error-300">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-text-subtle">
              Restricted workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-text">Scenario authoring is locked</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
              This workspace is reserved for physicians and clinical validators. Your current account does not have
              access to scenario authoring.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="primary" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </Button>
          <Badge variant="neutral">Allowed: admin, super_admin, clinical_validator</Badge>
        </div>
      </Card>
    </main>
  );
}

function ScenarioMobileCard({
  scenario,
  onDuplicate,
  onDelete,
}: {
  scenario: ScenarioSummary;
  onDuplicate: (scenario: ScenarioSummary) => void;
  onDelete: (scenario: ScenarioSummary) => void;
}): JSX.Element {
  const CategoryIcon = SCENARIO_CATEGORY_META[scenario.category].icon;

  return (
    <Card variant="outlined" padding="md" className="space-y-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border',
            'bg-gradient-to-br shadow-sm',
            SCENARIO_CATEGORY_META[scenario.category].accent,
          )}
        >
          <CategoryIcon className="h-5 w-5 text-text" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-text">{scenario.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-muted">{scenario.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="neutral">{SCENARIO_CATEGORY_META[scenario.category].label}</Badge>
        <Badge variant={getDifficultyBadgeVariant(scenario.difficulty)}>{SCENARIO_DIFFICULTY_LABELS[scenario.difficulty]}</Badge>
        <Badge variant={getStatusBadgeVariant(scenario.status)}>{SCENARIO_STATUS_LABELS[scenario.status]}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface-muted/70 p-4 text-sm">
        <div>
          <dt className="text-text-subtle">Duration</dt>
          <dd className="font-medium text-text">{scenario.estimatedDuration} min</dd>
        </div>
        <div>
          <dt className="text-text-subtle">Updated</dt>
          <dd className="font-medium text-text">{formatRelative(scenario.updatedAt)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Eye className="h-4 w-4" />}
          onClick={() => window.location.assign(`/admin/scenarios/${scenario.id}/edit`)}
        >
          Edit
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Copy className="h-4 w-4" />}
          onClick={() => onDuplicate(scenario)}
        >
          Duplicate
        </Button>
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={() => onDelete(scenario)}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}

export function ScenarioListPage(): JSX.Element {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role);
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>(() => mockScenarios);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ScenarioCategory | 'ALL'>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<ScenarioDifficulty | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ScenarioStatus | 'ALL'>('ALL');
  const [sortKey, setSortKey] = useState<ScenarioSortKey>('newest');
  const [page, setPage] = useState(1);

  const hasAccess = role !== undefined && ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, difficultyFilter, statusFilter, sortKey]);

  const filteredScenarios = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const visible = scenarios.filter((scenario) => {
      const matchesSearch = normalizedSearch.length === 0 || scenario.title.toLowerCase().includes(normalizedSearch);
      const matchesCategory = categoryFilter === 'ALL' || scenario.category === categoryFilter;
      const matchesDifficulty = difficultyFilter === 'ALL' || scenario.difficulty === difficultyFilter;
      const matchesStatus = statusFilter === 'ALL' || scenario.status === statusFilter;

      return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
    });

    return [...visible].sort((left, right) => {
      if (sortKey === 'oldest') return left.createdAt.getTime() - right.createdAt.getTime();
      if (sortKey === 'recently_updated') return right.updatedAt.getTime() - left.updatedAt.getTime();
      return right.createdAt.getTime() - left.createdAt.getTime();
    });
  }, [categoryFilter, difficultyFilter, scenarios, search, sortKey, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredScenarios.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredScenarios.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  const counts = useMemo(() => {
    const published = scenarios.filter((scenario) => scenario.status === 'PUBLISHED').length;
    const drafts = scenarios.filter((scenario) => scenario.status === 'DRAFT').length;
    const reviews = scenarios.filter((scenario) => scenario.status === 'REVIEW').length;
    const updatedToday = scenarios.filter((scenario) => formatRelative(scenario.updatedAt) === 'Today').length;

    return { published, drafts, reviews, updatedToday };
  }, [scenarios]);

  const handleDuplicate = (scenario: ScenarioSummary): void => {
    const duplicated: ScenarioSummary = {
      ...scenario,
      id: `${scenario.id}-copy-${Date.now()}`,
      title: `${scenario.title} Copy`,
      status: 'DRAFT',
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setScenarios((current) => [duplicated, ...current]);
  };

  const handleDelete = (scenario: ScenarioSummary): void => {
    const confirmed = window.confirm(`Delete "${scenario.title}"? This action only affects local mock data for now.`);
    if (!confirmed) return;

    setScenarios((current) => current.filter((item) => item.id !== scenario.id));
  };

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-border pb-6">
          <div className="max-w-3xl space-y-4">
            <Badge variant="info" size="md" className="w-fit uppercase tracking-[0.18em]">
              Physician authoring workspace
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                Scenario library
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
                Create, review, and manage clinical scenarios before they are published to paramedics.
                This slice is scoped to the list experience first, with the editor tabs coming next.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/admin/scenarios/new')}
            >
              Create Scenario
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card variant="outlined" padding="md" className="border-primary-200/80">
            <p className="text-sm font-medium text-text-subtle">Total scenarios</p>
            <p className="mt-2 text-3xl font-semibold text-text">{scenarios.length}</p>
            <p className="mt-2 text-sm text-text-muted">{counts.updatedToday} updated today</p>
          </Card>
          <Card variant="outlined" padding="md">
            <p className="text-sm font-medium text-text-subtle">Published</p>
            <p className="mt-2 text-3xl font-semibold text-text">{counts.published}</p>
            <p className="mt-2 text-sm text-text-muted">Visible to paramedics</p>
          </Card>
          <Card variant="outlined" padding="md">
            <p className="text-sm font-medium text-text-subtle">Needs review</p>
            <p className="mt-2 text-3xl font-semibold text-text">{counts.reviews}</p>
            <p className="mt-2 text-sm text-text-muted">Awaiting clinical validation</p>
          </Card>
          <Card variant="outlined" padding="md">
            <p className="text-sm font-medium text-text-subtle">Drafts</p>
            <p className="mt-2 text-3xl font-semibold text-text">{counts.drafts}</p>
            <p className="mt-2 text-sm text-text-muted">Work in progress</p>
          </Card>
        </div>

        <Card variant="outlined" padding="md" className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Input
                label="Search"
                placeholder="Search by title"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />

              <label className="space-y-2">
                <span className="block text-sm font-medium text-text">Category</span>
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value as ScenarioCategory | 'ALL')}
                    className="block w-full appearance-none rounded-lg border border-border bg-surface px-4 py-2.5 pr-10 text-text shadow-sm transition duration-200 ease-standard focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
                  >
                    <option value="ALL">All categories</option>
                    {Object.entries(SCENARIO_CATEGORY_META).map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                  <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
                </div>
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-medium text-text">Difficulty</span>
                <div className="relative">
                  <select
                    value={difficultyFilter}
                    onChange={(event) =>
                      setDifficultyFilter(event.target.value as ScenarioDifficulty | 'ALL')
                    }
                    className="block w-full appearance-none rounded-lg border border-border bg-surface px-4 py-2.5 pr-10 text-text shadow-sm transition duration-200 ease-standard focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
                  >
                    <option value="ALL">All difficulties</option>
                    {Object.entries(SCENARIO_DIFFICULTY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
                </div>
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-medium text-text">Status</span>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as ScenarioStatus | 'ALL')}
                    className="block w-full appearance-none rounded-lg border border-border bg-surface px-4 py-2.5 pr-10 text-text shadow-sm transition duration-200 ease-standard focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
                  >
                    <option value="ALL">All statuses</option>
                    {Object.entries(SCENARIO_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
                </div>
              </label>
            </div>

            <label className="space-y-2 lg:w-56">
              <span className="block text-sm font-medium text-text">Sort</span>
              <div className="relative">
                <select
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as ScenarioSortKey)}
                  className="block w-full appearance-none rounded-lg border border-border bg-surface px-4 py-2.5 pr-10 text-text shadow-sm transition duration-200 ease-standard focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
                >
                  {SCENARIO_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
              </div>
            </label>
          </div>
        </Card>

        <Card variant="outlined" padding="none" className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-text">Scenario records</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Showing {pageItems.length} of {filteredScenarios.length} scenarios
                </p>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Badge variant="neutral">{formatDate(new Date())}</Badge>
                <Badge variant="info">{formatRelative(new Date())}</Badge>
              </div>
            </div>
          </div>

          {pageItems.length > 0 ? (
            <>
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-surface-muted/70">
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-text-subtle">
                        <th className="px-5 py-3">Title</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Difficulty</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Updated</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-surface">
                      {pageItems.map((scenario) => {
                        const CategoryIcon = SCENARIO_CATEGORY_META[scenario.category].icon;

                        return (
                          <tr key={scenario.id} className="group transition hover:bg-surface-muted/60">
                            <td className="px-5 py-4">
                              <div className="flex items-start gap-3">
                                <div
                                  className={cn(
                                    'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-gradient-to-br shadow-sm',
                                    SCENARIO_CATEGORY_META[scenario.category].accent,
                                  )}
                                >
                                  <CategoryIcon className="h-4 w-4 text-text" aria-hidden="true" />
                                </div>
                                <div className="min-w-0">
                                  <Link
                                    to={`/admin/scenarios/${scenario.id}/edit`}
                                    className="block truncate font-semibold text-text transition hover:text-primary-700"
                                  >
                                    {scenario.title}
                                  </Link>
                                  <p className="mt-1 line-clamp-2 max-w-xl text-sm leading-relaxed text-text-muted">
                                    {scenario.description}
                                  </p>
                                  <p className="mt-2 text-xs text-text-subtle">Author: {scenario.authorName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <Badge variant="neutral">{SCENARIO_CATEGORY_META[scenario.category].label}</Badge>
                            </td>
                            <td className="px-5 py-4">
                              <Badge variant={getDifficultyBadgeVariant(scenario.difficulty)}>
                                {SCENARIO_DIFFICULTY_LABELS[scenario.difficulty]}
                              </Badge>
                            </td>
                            <td className="px-5 py-4">
                              <Badge variant={getStatusBadgeVariant(scenario.status)}>
                                {SCENARIO_STATUS_LABELS[scenario.status]}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-sm text-text-muted">
                              <div className="font-medium text-text">{formatDate(scenario.updatedAt)}</div>
                              <div className="text-xs text-text-subtle">{formatRelative(scenario.updatedAt)}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={<Eye className="h-4 w-4" />}
                                  onClick={() => navigate(`/admin/scenarios/${scenario.id}/edit`)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  leftIcon={<Copy className="h-4 w-4" />}
                                  onClick={() => handleDuplicate(scenario)}
                                >
                                  Duplicate
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  leftIcon={<Trash2 className="h-4 w-4" />}
                                  onClick={() => handleDelete(scenario)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4 p-4 md:hidden">
                {pageItems.map((scenario) => (
                  <ScenarioMobileCard
                    key={scenario.id}
                    scenario={scenario}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[22rem] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-muted text-primary-600 shadow-sm">
                <Search className="h-8 w-8" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-text">No scenarios match your filters</h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-muted">
                Try clearing the search term or adjusting category, difficulty, and status to see more scenarios.
              </p>
              <Button
                className="mt-6"
                variant="outline"
                leftIcon={<ChevronLeft className="h-4 w-4" />}
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('ALL');
                  setDifficultyFilter('ALL');
                  setStatusFilter('ALL');
                  setSortKey('newest');
                }}
              >
                Reset filters
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-muted">
              Page {currentPage} of {Math.max(1, totalPages)} • {filteredScenarios.length} visible scenarios
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ChevronLeft className="h-4 w-4" />}
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ChevronRight className="h-4 w-4" />}
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
    </div>
  );
}
