// ============================================================================
// File: apps/web/src/features/dashboard/components/DashboardHeader.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Authenticated top bar with navigation placeholder and user menu.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Avatar, Button } from '@imedica/ui';
import { ChevronDown, LogOut, Settings, UserCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/authStore.js';
import { cn } from '@/lib/cn.js';
import { clearAccessToken } from '@/lib/session.js';

const DEFAULT_NAV_ITEMS = [
  { label: 'Scenarios', href: '/dashboard', disabled: true },
  { label: 'My Progress', href: '/dashboard', disabled: true },
  { label: 'Settings', href: '/settings', disabled: true },
];

function getNavItems(role?: string) {
  const items = [...DEFAULT_NAV_ITEMS];
  
  if (role === 'admin' || role === 'super_admin' || role === 'clinical_validator') {
    items.unshift({ label: 'Analytics', href: '/admin/analytics', disabled: false });
    items.unshift({ label: 'Admin Scenarios', href: '/admin/scenarios', disabled: false });
  }

  if (role === 'admin' || role === 'super_admin') {
    items.unshift({ label: 'AI Hub', href: '/admin/ai', disabled: false });
    items.unshift({ label: 'Admin Users', href: '/admin/users', disabled: false });
  }
  
  return items;
}

export function DashboardHeader(): JSX.Element {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);

  const initials = useMemo(() => {
    const first = user?.firstName?.[0] ?? '';
    const last = user?.lastName?.[0] ?? '';
    return `${first}${last}`.trim() || 'IM';
  }, [user?.firstName, user?.lastName]);

  const handleLogout = async (): Promise<void> => {
    setIsOpen(false);
    clearAccessToken();
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-sticky border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface-elevated shadow-sm">
            <span className="text-lg font-semibold text-primary-600">+</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-text">Imedica</p>
            <p className="text-xs text-text-subtle">Training platform</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary navigation">
          {getNavItems(user?.role).map((item) => (
            <Link
              key={item.label}
              to={item.href}
              aria-disabled={item.disabled}
              className={cn(
                'text-sm font-medium transition',
                item.disabled ? 'cursor-not-allowed text-text-subtle' : 'text-text-muted hover:text-text',
              )}
              onClick={(event) => {
                if (item.disabled) event.preventDefault();
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            className="flex items-center gap-3"
            onClick={() => setIsOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={isOpen}
          >
            <Avatar alt={user?.email ?? 'User'} fallback={initials} size="sm" />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium text-text">{user?.firstName ?? 'User'}</span>
              <span className="block text-xs text-text-subtle">{user?.role ?? 'paramedic'}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-text-subtle" aria-hidden="true" />
          </Button>

          {isOpen ? (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-border bg-surface-elevated p-2 shadow-xl">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-text-muted transition hover:bg-surface-muted hover:text-text"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/profile');
                }}
              >
                <UserCircle2 className="h-4 w-4" aria-hidden="true" />
                Profile
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-text-muted transition hover:bg-surface-muted hover:text-text"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/settings');
                }}
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Settings
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-error-600 transition hover:bg-error-50 hover:text-error-700 dark:hover:bg-error-950/30"
                onClick={() => {
                  void handleLogout();
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
