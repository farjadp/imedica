// ============================================================================
// File: apps/web/src/features/admin/pages/PageManagementPage.tsx
// Why: Admin interface to manage dynamic content for marketing pages (CMS).
// Env / Identity: Web (browser runtime)
// ============================================================================

import { Button, Input } from '@imedica/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, ImagePlus, FileText } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { adminPagesService, type PageContent } from '../services/pagesService.js';

export function PageManagementPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [formData, setFormData] = useState<{ title: string; contentJson: any } | null>(null);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['admin-pages'],
    queryFn: adminPagesService.getPages,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { slug: string; title: string; contentJson: any }) =>
      adminPagesService.updatePage(payload.slug, { title: payload.title, contentJson: payload.contentJson }),
    onSuccess: () => {
      alert('Page content updated successfully');
      void queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
      if (selectedSlug) {
        void queryClient.invalidateQueries({ queryKey: ['public-page', selectedSlug] });
      }
    },
    onError: () => {
      alert('Failed to update page content');
    },
  });

  useEffect(() => {
    if (selectedSlug) {
      const page = pages.find((p) => p.slug === selectedSlug);
      if (page) {
        setFormData({ title: page.title, contentJson: page.contentJson });
      }
    } else {
      setFormData(null);
    }
  }, [selectedSlug, pages]);

  // Convert File to Base64
  const handleImageUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleJsonChange = (path: string[], value: any) => {
    if (!formData) return;
    
    setFormData((prev) => {
      if (!prev) return prev;
      const newJson = JSON.parse(JSON.stringify(prev.contentJson));
      
      let current = newJson;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i] as string];
      }
      current[path[path.length - 1] as string] = value;
      
      return { ...prev, contentJson: newJson };
    });
  };

  const renderField = (key: string, value: any, path: string[]) => {
    const isImage = key.toLowerCase().includes('image') || key.toLowerCase().includes('icon') || key.toLowerCase().includes('avatar');
    
    if (typeof value === 'string') {
      if (isImage) {
        return (
          <div key={path.join('.')} className="space-y-2 mb-4 p-4 border border-border rounded-lg bg-surface-muted/50">
            <label className="text-sm font-medium text-text">{key}</label>
            {value && (
              <div className="relative h-40 w-full overflow-hidden rounded-md border border-border bg-surface">
                <img src={value} alt={key} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex items-center gap-4">
              <Input
                type="text"
                value={value}
                onChange={(e) => handleJsonChange(path, e.target.value)}
                placeholder="Image URL or Base64"
                className="flex-1"
              />
              <span className="text-sm text-text-subtle">OR</span>
              <div className="relative flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const base64 = await handleImageUpload(file);
                        handleJsonChange(path, base64);
                      } catch (error) {
                        alert('Failed to convert image');
                      }
                    }
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );
      }

      if (value.length > 100 || key.toLowerCase().includes('description') || key.toLowerCase().includes('content')) {
        return (
          <div key={path.join('.')} className="space-y-2 mb-4">
            <label className="text-sm font-medium text-text capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
            <textarea
              value={value}
              onChange={(e) => handleJsonChange(path, e.target.value)}
              className="w-full min-h-[100px] rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder-text-subtle focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        );
      }

      return (
        <div key={path.join('.')} className="space-y-2 mb-4">
          <label className="text-sm font-medium text-text capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
          <Input
            type="text"
            value={value}
            onChange={(e) => handleJsonChange(path, e.target.value)}
          />
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return (
          <div key={path.join('.')} className="mb-6 rounded-xl border border-border bg-surface p-4 shadow-sm">
            <h4 className="text-md mb-4 font-semibold text-text capitalize">{key.replace(/([A-Z])/g, ' $1').trim()} (List)</h4>
            <div className="space-y-6">
              {value.map((item, index) => (
                <div key={index} className="pl-4 border-l-2 border-border/50 pb-4">
                  <h5 className="text-sm font-medium text-text-subtle mb-3">Item {index + 1}</h5>
                  {Object.entries(item).map(([subKey, subVal]) => 
                    renderField(subKey, subVal, [...path, index.toString(), subKey])
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      // Nested object
      return (
        <div key={path.join('.')} className="mb-6 rounded-xl border border-border bg-surface p-4 shadow-sm">
          <h4 className="text-md mb-4 font-semibold text-text capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
          {Object.entries(value).map(([subKey, subVal]) => 
            renderField(subKey, subVal, [...path, subKey])
          )}
        </div>
      );
    }

    return null;
  };

  const handleSave = () => {
    if (!selectedSlug || !formData) return;
    updateMutation.mutate({
      slug: selectedSlug,
      title: formData.title,
      contentJson: formData.contentJson,
    });
  };

  const handleInitializeExample = () => {
    if (!selectedSlug) return;
    
    // Default templates for specific pages if they don't exist
    let newJson = {};
    if (selectedSlug === 'about') {
      newJson = {
        heroTitle: "About Us",
        heroDescription: "We are transforming BLS training.",
        heroImage: "",
        sections: [
          { title: "Our Story", content: "It started in 2026...", image: "" }
        ]
      };
    } else if (selectedSlug === 'team') {
      newJson = {
        heroTitle: "Meet the Team",
        members: [
          { name: "John Doe", role: "CEO", avatarImage: "", bio: "CEO bio" }
        ]
      };
    }

    setFormData({
      title: selectedSlug.toUpperCase(),
      contentJson: newJson
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Page Management</h1>
          <p className="mt-2 text-text-subtle">
            Dynamically edit titles, texts, and images for your marketing pages.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!selectedSlug || !formData || updateMutation.isPending}
          className="gap-2"
        >
          {updateMutation.isPending ? 'Saving...' : <><Save className="h-4 w-4" /> Save Changes</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-text mb-4">Select Page</h2>
            
            <div className="space-y-4">
              <select 
                value={selectedSlug} 
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="" disabled>Select a page to edit</option>
                <option value="about">About Us</option>
                <option value="team">Team</option>
                <option value="problem">The Problem</option>
                <option value="solutions">Solutions</option>
              </select>
            </div>

            {pages.length > 0 && (
              <div className="mt-8 space-y-3">
                <h3 className="text-sm font-medium text-text-subtle uppercase tracking-wider">Existing Pages in DB</h3>
                <ul className="space-y-2">
                  {pages.map((p) => (
                    <li key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-surface-muted border border-transparent hover:border-border cursor-pointer transition" onClick={() => setSelectedSlug(p.slug)}>
                      <span className="text-sm font-medium">{p.title}</span>
                      <span className="text-xs text-text-subtle px-2 py-1 bg-surface rounded-full border border-border">{p.slug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm min-h-[500px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-text-subtle">Loading...</div>
          ) : !selectedSlug ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-text-subtle">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>Select a page from the sidebar to begin editing.</p>
            </div>
          ) : formData ? (
            <div className="space-y-8 animate-in fade-in">
              <div className="space-y-2 pb-6 border-b border-border">
                <label className="text-sm font-medium text-text">Page Title (Meta)</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-lg font-semibold"
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-text flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-500" /> Page Content
                </h3>
                
                {Object.keys(formData.contentJson).length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-border rounded-xl">
                    <p className="text-text-subtle mb-4">This page has no content structure yet.</p>
                    <Button variant="outline" onClick={handleInitializeExample}>
                      Initialize Default Structure
                    </Button>
                  </div>
                ) : (
                  Object.entries(formData.contentJson).map(([key, value]) => 
                    renderField(key, value, [key])
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-text-subtle mb-4">No content found for "{selectedSlug}" in the database.</p>
              <Button onClick={handleInitializeExample}>Create New Content</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
