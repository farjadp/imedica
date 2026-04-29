// ============================================================================
// File: apps/web/src/features/admin/pages/UserManagementPage.tsx
// Version: 1.0.0 — 2026-04-24
// Why: Admin panel interface for managing users, roles, and access.
// Env / Identity: Web (browser runtime)
// ============================================================================

import type { PublicUser, UserRole } from '@imedica/shared';
import { Badge, Button, Card, Input } from '@imedica/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ChevronLeft, ChevronRight, Edit2, Filter, Plus, Search, Trash2, UserPlus, Shield, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/authStore.js';
import { cn } from '@/lib/cn.js';
import { userService } from '../services/userService.js';

const PAGE_SIZE = 20;
const ALLOWED_ROLES = ['admin', 'super_admin'];

function formatDate(date: Date | string | null): string {
  if (!date) return 'Never';
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

const ROLE_LABELS: Record<UserRole, string> = {
  paramedic: 'Paramedic',
  admin: 'Administrator',
  super_admin: 'Super Admin',
  clinical_validator: 'Clinical Validator',
};

const ROLE_VARIANTS: Record<UserRole, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  paramedic: 'neutral',
  clinical_validator: 'info',
  admin: 'warning',
  super_admin: 'error',
};

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
            <h1 className="text-2xl font-semibold tracking-tight text-text">Access Denied</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
              You must be an Administrator or Super Admin to manage users and access control settings.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="primary" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </Button>
          <Badge variant="neutral">Allowed: admin, super_admin</Badge>
        </div>
      </Card>
    </main>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function UserManagementPage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  
  const hasAccess = currentUser?.role && ALLOWED_ROLES.includes(currentUser.role);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    passwordRaw: '',
    firstName: '',
    lastName: '',
    role: 'paramedic' as UserRole,
  });

  // Queries
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userService.getUsers(),
    enabled: !!hasAccess,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: () => userService.createUser(createForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsCreateModalOpen(false);
      setCreateForm({ email: '', passwordRaw: '', firstName: '', lastName: '', role: 'paramedic' });
    },
    onError: (error) => {
      alert(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) => userService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      alert(`Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      alert(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const handleDelete = (user: PublicUser) => {
    if (user.id === currentUser?.id) {
      alert("You cannot delete yourself.");
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to delete ${user.email}? This action is permanent.`);
    if (confirmed) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot change your own role here.");
      return;
    }
    updateRoleMutation.mutate({ userId, role: newRole as UserRole });
  };

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    
    // In local dev, sometimes date strings are not properly cast, so ensure they are objects if filtering
    const visible = users.filter((user) => {
      const nameMatch = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(normalizedSearch);
      const emailMatch = user.email.toLowerCase().includes(normalizedSearch);
      const matchesSearch = normalizedSearch.length === 0 || nameMatch || emailMatch;
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });

    return visible;
  }, [roleFilter, search, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE);

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      {/* Create Modal Overlay */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4 backdrop-blur-md">
          <Card variant="default" padding="lg" className="w-full max-w-md animate-in fade-in zoom-in-95 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight text-text">Add New User</h2>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-full p-2 text-text-subtle transition hover:bg-surface-muted hover:text-text"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  required
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm(f => ({ ...f, firstName: e.target.value }))}
                />
                <Input
                  label="Last Name"
                  required
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm(f => ({ ...f, lastName: e.target.value }))}
                />
              </div>
              <Input
                label="Email Address"
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
              />
              <Input
                label="Temporary Password"
                type="text"
                required
                value={createForm.passwordRaw}
                onChange={(e) => setCreateForm(f => ({ ...f, passwordRaw: e.target.value }))}
              />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-text">Assign Role</span>
                <select
                  required
                  value={createForm.role}
                  onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="block w-full appearance-none rounded-lg border border-border bg-surface px-4 py-2.5 text-text shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>
              
              <div className="mt-8 flex justify-end gap-3 border-t border-border pt-4">
                <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-text">System Users</h1>
          <p className="text-base text-text-muted">Manage roles, permissions, and platform access.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            variant="primary" 
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-full shadow-sm"
          >
            Add User
          </Button>
        </div>
      </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end bg-surface-muted/30 p-4 rounded-2xl border border-border">
            <div className="flex-1">
              <Input
                label="Search Users"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <label className="w-full sm:w-64 space-y-2">
              <span className="block text-sm font-medium text-text">Role</span>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
                  className="block w-full appearance-none rounded-lg border border-border bg-surface px-4 py-2.5 pr-10 text-text shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ALL">All Roles</option>
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
              </div>
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-text">System Users</h2>
            <p className="mt-1 text-sm text-text-muted">
              {isLoading ? 'Loading users...' : `Showing ${pageItems.length} of ${filteredUsers.length} users`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-muted">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-text-subtle">
                  <th className="px-5 py-3">User Details</th>
                  <th className="px-5 py-3">Role & Access</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined / Last Login</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {pageItems.map((user) => (
                  <tr key={user.id} className="group transition hover:bg-surface-muted">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
                          {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-text">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-text-muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        disabled={user.id === currentUser?.id}
                      >
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={user.emailVerified ? 'success' : 'warning'}>
                        {user.emailVerified ? 'Verified' : 'Pending Verification'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      <div>Joined: {formatDate(user.createdAt)}</div>
                      <div className="text-xs text-text-subtle">Activity: {formatDate(user.lastLoginAt)}</div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        disabled={user.id === currentUser?.id || deleteMutation.isPending}
                        onClick={() => handleDelete(user)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-text-muted">
                      No users found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-muted">
              Page {currentPage} of {Math.max(1, totalPages)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ChevronLeft className="h-4 w-4" />}
                disabled={currentPage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ChevronRight className="h-4 w-4" />}
                disabled={currentPage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
    </div>
  );
}
