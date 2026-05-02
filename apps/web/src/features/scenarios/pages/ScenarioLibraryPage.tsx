// ============================================================================
// File: apps/web/src/features/scenarios/pages/ScenarioLibraryPage.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Public scenario library for authenticated paramedics to browse training.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Badge, Button, Card, Input } from '@imedica/ui';
import {
  Baby,
  Brain,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FlaskConical,
  Heart,
  ShieldAlert,
  Trees,
  Wind,
  Search,
  Activity,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '@/lib/api-client.js';
import { cn } from '@/lib/cn.js';

import {
  SCENARIO_CATEGORY_META,
  SCENARIO_DIFFICULTY_LABELS,
  SCENARIO_DIFFICULTY_VARIANTS,
  type ScenarioCategory,
  type ScenarioDifficulty,
} from '../types.js';

const PAGE_SIZE = 12;
const MIN_DURATION = 5;
const MAX_DURATION = 60;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title_az', label: 'Title A-Z' },
  { value: 'title_za', label: 'Title Z-A' },
] as const;

const CATEGORY_ORDER: ScenarioCategory[] = [
  'CARDIAC',
  'RESPIRATORY',
  'TRAUMA',
  'NEUROLOGICAL',
  'PEDIATRIC',
  'OBSTETRIC',
  'TOXICOLOGY',
  'ENVIRONMENTAL',
  'BEHAVIORAL',
  'OTHER',
];

const DIFFICULTY_OPTIONS: ScenarioDifficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

interface PublicScenarioCard {
  id: string;
  title: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  estimatedDuration: number;
  createdAt: string;
  updatedAt: string;
}

interface LibraryResponse {
  items: PublicScenarioCard[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function getCategoryIcon(category: ScenarioCategory) {
  switch (category) {
    case 'CARDIAC':
      return Heart;
    case 'RESPIRATORY':
      return Wind;
    case 'NEUROLOGICAL':
      return Brain;
    case 'TRAUMA':
      return ShieldAlert;
    case 'PEDIATRIC':
      return Baby;
    case 'TOXICOLOGY':
      return FlaskConical;
    case 'ENVIRONMENTAL':
      return Trees;
    default:
      return Activity;
  }
}

function DifficultyBadge({ difficulty }: { difficulty: ScenarioDifficulty }): JSX.Element {
  return <Badge variant={SCENARIO_DIFFICULTY_VARIANTS[difficulty]}>{SCENARIO_DIFFICULTY_LABELS[difficulty]}</Badge>;
}

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (values: string[]) => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);

  const toggle = (value: string): void => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }

    onChange([...selected, value]);
  };

  return (
    <div className="relative">
      <Button variant="outline" size="sm" rightIcon={<ChevronDown className="h-4 w-4" />} onClick={() => setOpen((value) => !value)}>
        {label}
        {selected.length > 0 ? <span className="ml-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">{selected.length}</span> : null}
      </Button>

      {open ? (
        <div className="absolute left-0 top-full z-10 mt-2 w-72 rounded-2xl border border-border bg-surface-elevated p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-text">{label}</p>
            <button type="button" className="text-xs text-text-muted hover:text-text" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {options.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-text hover:bg-surface-muted">
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggle(option.value)}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DurationRange({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}): JSX.Element {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">Duration</p>
        <p className="text-xs text-text-muted">
          {minValue} - {maxValue} min
        </p>
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-surface-muted/40 p-4">
        <input
          type="range"
          min={MIN_DURATION}
          max={MAX_DURATION}
          value={minValue}
          onChange={(event) => {
            const next = Number(event.target.value);
            onMinChange(Math.min(next, maxValue));
          }}
          className="w-full accent-primary-600"
        />
        <input
          type="range"
          min={MIN_DURATION}
          max={MAX_DURATION}
          value={maxValue}
          onChange={(event) => {
            const next = Number(event.target.value);
            onMaxChange(Math.max(next, minValue));
          }}
          className="w-full accent-primary-600"
        />
      </div>
    </div>
  );
}

function ScenarioCard({
  scenario,
}: {
  scenario: PublicScenarioCard;
}): JSX.Element {
  const navigate = useNavigate();
  const CategoryIcon = getCategoryIcon(scenario.category);

  return (
    <div
      role="button"
      tabIndex={0}
      className="group h-full cursor-pointer rounded-xl transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background"
      onClick={() => navigate(`/scenarios/${scenario.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(`/scenarios/${scenario.id}`);
        }
      }}
    >
      <Card variant="outlined" padding="md" className="space-y-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border shadow-sm',
              'bg-gradient-to-br',
              SCENARIO_CATEGORY_META[scenario.category].accent,
            )}
          >
            <CategoryIcon className="h-5 w-5 text-text" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-text">{scenario.title}</h3>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">{truncateText(scenario.description, 100)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">{SCENARIO_CATEGORY_META[scenario.category].label}</Badge>
          <DifficultyBadge difficulty={scenario.difficulty} />
          <Badge variant="neutral">{scenario.estimatedDuration} min</Badge>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-text-muted">Ready for training</p>
          <Button variant="primary" size="sm" onClick={(event) => event.stopPropagation()} disabled>
            Start Scenario
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function ScenarioLibraryPage(): JSX.Element {
  const [items, setItems] = useState<PublicScenarioCard[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<ScenarioCategory[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<ScenarioDifficulty[]>([]);
  const [minDuration, setMinDuration] = useState(MIN_DURATION);
  const [maxDuration, setMaxDuration] = useState(MAX_DURATION);
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['value']>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const categoryOptions = useMemo(
    () => CATEGORY_ORDER.map((category) => ({ value: category, label: SCENARIO_CATEGORY_META[category].label })),
    [],
  );

  const difficultyOptions = useMemo(
    () => DIFFICULTY_OPTIONS.map((difficulty) => ({ value: difficulty, label: SCENARIO_DIFFICULTY_LABELS[difficulty] })),
    [],
  );

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategories, selectedDifficulties, minDuration, maxDuration, sort]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLibrary(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set('search', search.trim());
        selectedCategories.forEach((category) => params.append('category', category));
        selectedDifficulties.forEach((difficulty) => params.append('difficulty', difficulty));
        params.set('minDuration', String(minDuration));
        params.set('maxDuration', String(maxDuration));
        params.set('sort', sort);
        params.set('page', String(page));
        params.set('limit', String(PAGE_SIZE));

        const response = await apiClient.get<{ success: true; data: LibraryResponse }>(`/api/scenarios/library?${params.toString()}`, {
          signal: controller.signal,
        });

        setItems(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
        setTotal(response.data.data.total);
      } catch {
        if (!controller.signal.aborted) {
          setItems([]);
          setError('Unable to load scenarios.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadLibrary();

    return () => controller.abort();
  }, [search, selectedCategories, selectedDifficulties, minDuration, maxDuration, sort, page]);

  const toggleCategory = (category: ScenarioCategory): void => {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    );
  };

  const toggleDifficulty = (difficulty: ScenarioDifficulty): void => {
    setSelectedDifficulties((current) =>
      current.includes(difficulty) ? current.filter((item) => item !== difficulty) : [...current, difficulty],
    );
  };

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-text">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary-200/25 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-info-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card variant="elevated" padding="lg" className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-text-subtle">Training library</p>
            <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">Scenario Library</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-text-muted sm:text-base">
              Browse published clinical training scenarios and choose the one you want to study next.
            </p>
          </div>

          <Card variant="outlined" padding="md" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr]">
              <Input
                label="Search"
                placeholder="Search by title"
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <div className="flex flex-wrap items-end gap-2">
                <MultiSelectFilter
                  label="Categories"
                  options={categoryOptions}
                  selected={selectedCategories}
                  onChange={(values) => setSelectedCategories(values as ScenarioCategory[])}
                />
                <MultiSelectFilter
                  label="Difficulty"
                  options={difficultyOptions}
                  selected={selectedDifficulties}
                  onChange={(values) => setSelectedDifficulties(values as ScenarioDifficulty[])}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">Sort</label>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as typeof sort)}
                  className={cn(
                    'block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text shadow-sm transition duration-200 ease-standard',
                    'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background',
                  )}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DurationRange
              minValue={minDuration}
              maxValue={maxDuration}
              onMinChange={setMinDuration}
              onMaxChange={setMaxDuration}
            />
          </Card>

          {error ? (
            <Card variant="outlined" padding="md" className="border-dashed">
              <p className="text-sm text-text-muted">{error}</p>
            </Card>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-muted">
              {total} published scenario{total === 1 ? '' : 's'} found
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">
                Page {page} of {Math.max(1, totalPages)}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} leftIcon={<ChevronLeft className="h-4 w-4" />}>
                Dashboard
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-muted/50 p-8 text-sm text-text-muted">
              Loading scenarios...
            </div>
          ) : items.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((scenario) => (
                <ScenarioCard key={scenario.id} scenario={scenario} />
              ))}
            </div>
          ) : (
            <Card variant="outlined" padding="lg" className="rounded-2xl border-dashed text-center">
              <p className="text-lg font-semibold text-text">No scenarios found</p>
              <p className="mt-2 text-sm text-text-muted">
                Adjust the filters or search to find another published training scenario.
              </p>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <Button
              variant="outline"
              leftIcon={<ChevronLeft className="h-4 w-4" />}
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                .map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === page ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ))}
            </div>

            <Button
              variant="outline"
              rightIcon={<ChevronRight className="h-4 w-4" />}
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
