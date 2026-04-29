// ============================================================================
// File: apps/web/src/features/admin/components/AdminLayout.tsx
// Why: Unified layout for the admin panel with persistent sidebar and header.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Avatar, Button } from '@imedica/ui';
import { 
  Activity, 
  BookOpen, 
  Database, 
  FileText, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  Users 
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/authStore.js';
import { cn } from '@/lib/cn.js';
import { clearAccessToken } from '@/lib/session.js';

const ADMIN_NAV_ITEMS = [
  { label: 'Analytics', href: '/admin/analytics', icon: Activity },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Scenarios', href: '/admin/scenarios', icon: BookOpen },
  { label: 'AI Hub', href: '/admin/ai', icon: Database },
  { label: 'Page Content', href: '/admin/pages', icon: FileText },
];

export function AdminLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const initials = useMemo(() => {
    const first = user?.firstName?.[0] ?? '';
    const last = user?.lastName?.[0] ?? '';
    return `${first}${last}`.trim() || 'IM';
  }, [user?.firstName, user?.lastName]);

  const handleLogout = async (): Promise<void> => {
    clearAccessToken();
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const item = ADMIN_NAV_ITEMS.find((nav) => location.pathname.startsWith(nav.href));
    return item ? item.label : 'Admin Panel';
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-text">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-overlay/80 backdrop-blur-sm lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface-elevated transition-transform lg:static lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center px-6 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
              <span className="text-sm font-bold">+</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-text">Imedica</span>
            <span className="ml-1 rounded-md bg-error-100 px-1.5 py-0.5 text-[10px] font-bold text-error-700 uppercase tracking-widest">
              Admin
            </span>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <p className="px-2 text-xs font-semibold uppercase tracking-wider text-text-subtle mb-4">
            Menu
          </p>
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive 
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400" 
                    : "text-text-muted hover:bg-surface-muted hover:text-text"
                )}
              >
                <item.icon 
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-primary-600 dark:text-primary-400" : "text-text-subtle group-hover:text-text"
                  )} 
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-4">
          <Link 
            to="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          >
            <LayoutDashboard className="h-5 w-5 text-text-subtle" />
            Exit to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-md p-2 -ml-2 text-text-subtle hover:bg-surface-muted lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-text">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex mr-2">
              <div className="text-right">
                <p className="text-sm font-medium leading-none text-text">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="mt-1 text-xs text-text-subtle capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            
            <div className="group relative">
              <Avatar alt={user?.email ?? 'Admin'} fallback={initials} size="sm" className="cursor-pointer border border-border" />
              <div className="absolute right-0 top-full mt-2 hidden w-48 origin-top-right flex-col rounded-xl border border-border bg-surface py-1 shadow-lg group-hover:flex">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
