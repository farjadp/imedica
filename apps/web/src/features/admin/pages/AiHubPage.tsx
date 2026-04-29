// ============================================================================
// File: apps/web/src/features/admin/pages/AiHubPage.tsx
// Version: 1.0.0
// Why: Admin panel interface for managing the AI Knowledge Base (RAG).
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Badge, Button, Card, Input } from '@imedica/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ChevronLeft, Database, FileUp, Link as LinkIcon, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/authStore.js';
import { aiService, type AiDocument } from '../services/aiService.js';

const ALLOWED_ROLES = ['admin', 'super_admin'];

function formatDate(date: string): string {
  if (!date) return 'Never';
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
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
            <h1 className="text-2xl font-semibold tracking-tight text-text">Access Denied</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
              You must be an Administrator or Super Admin to access the AI Hub.
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

export function AiHubPage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  
  const hasAccess = currentUser?.role && ALLOWED_ROLES.includes(currentUser.role);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isHfModalOpen, setIsHfModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');

  // Queries
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['admin-ai-documents'],
    queryFn: () => aiService.getDocuments(),
    enabled: !!hasAccess,
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("File is required");
      return aiService.uploadFile(title, description, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-documents'] });
      setIsUploadModalOpen(false);
      resetForms();
    },
    onError: (error) => {
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const hfMutation = useMutation({
    mutationFn: () => aiService.uploadHuggingFace(title, description, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-documents'] });
      setIsHfModalOpen(false);
      resetForms();
    },
    onError: (error) => {
      alert(`HuggingFace import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-documents'] });
    },
    onError: (error) => {
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const resetForms = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setUrl('');
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  const handleHfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    hfMutation.mutate();
  };

  const handleDelete = (doc: AiDocument) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${doc.title}"? This will remove all associated vector embeddings.`);
    if (confirmed) {
      deleteMutation.mutate(doc.id);
    }
  };

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface text-text">

      {/* Upload File Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4 backdrop-blur-md">
          <Card variant="default" padding="lg" className="w-full max-w-md animate-in fade-in zoom-in-95 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight text-text">Upload Document</h2>
              <button 
                type="button"
                onClick={() => { setIsUploadModalOpen(false); resetForms(); }}
                className="rounded-full p-2 text-text-subtle transition hover:bg-surface-muted hover:text-text"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <Input
                label="Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-text">File (PDF, TXT, CSV)</span>
                <input
                  type="file"
                  required
                  accept=".pdf,.txt,.csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-text-subtle file:mr-4 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
                />
              </label>
              
              <div className="mt-8 flex justify-end gap-3 border-t border-border pt-4">
                <Button variant="outline" type="button" onClick={() => { setIsUploadModalOpen(false); resetForms(); }}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={uploadMutation.isPending || !file}>
                  {uploadMutation.isPending ? 'Processing...' : 'Upload & Process'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* HuggingFace Modal */}
      {isHfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4 backdrop-blur-md">
          <Card variant="default" padding="lg" className="w-full max-w-md animate-in fade-in zoom-in-95 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight text-text">Import from HuggingFace</h2>
              <button 
                type="button"
                onClick={() => { setIsHfModalOpen(false); resetForms(); }}
                className="rounded-full p-2 text-text-subtle transition hover:bg-surface-muted hover:text-text"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleHfSubmit} className="space-y-4">
              <Input
                label="Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Input
                label="Dataset URL (JSON, CSV, or Text)"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://huggingface.co/datasets/..."
              />
              
              <div className="mt-8 flex justify-end gap-3 border-t border-border pt-4">
                <Button variant="outline" type="button" onClick={() => { setIsHfModalOpen(false); resetForms(); }}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={hfMutation.isPending}>
                  {hfMutation.isPending ? 'Importing...' : 'Import Dataset'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-text-subtle">
              <Database className="h-4 w-4" />
              <span className="uppercase tracking-widest">Admin Workspace</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-text">AI Knowledge Base</h1>
            <p className="text-lg text-text-muted">Manage clinical documents and datasets to power AI features.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              leftIcon={<ChevronLeft className="h-4 w-4" />}
              onClick={() => navigate('/dashboard')}
              className="rounded-full"
            >
              Dashboard
            </Button>
            <Button 
              variant="secondary" 
              leftIcon={<LinkIcon className="h-4 w-4" />}
              onClick={() => setIsHfModalOpen(true)}
              className="rounded-full shadow-sm"
            >
              HuggingFace URL
            </Button>
            <Button 
              variant="primary" 
              leftIcon={<FileUp className="h-4 w-4" />}
              onClick={() => setIsUploadModalOpen(true)}
              className="rounded-full shadow-sm"
            >
              Upload File
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-text">Indexed Documents</h2>
            <p className="mt-1 text-sm text-text-muted">
              {isLoading ? 'Loading documents...' : `Total ${documents.length} documents indexed.`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-muted">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-text-subtle">
                  <th className="px-5 py-3">Title & Source</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Chunks</th>
                  <th className="px-5 py-3">Created At</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {documents.map((doc) => (
                  <tr key={doc.id} className="group transition hover:bg-surface-muted">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-text">{doc.title}</div>
                      <div className="text-xs text-text-muted">{doc.description || (doc.url && 'External URL') || 'Uploaded File'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="neutral">{doc.type}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={doc.status === 'READY' ? 'success' : doc.status === 'ERROR' ? 'error' : 'warning'}>
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {doc.chunkCount} parts
                    </td>
                    <td className="px-5 py-4 text-sm text-text-muted">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDelete(doc)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted">
                      No documents have been added to the knowledge base yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
