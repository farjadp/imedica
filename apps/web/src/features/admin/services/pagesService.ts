// ============================================================================
// File: apps/web/src/features/admin/services/pagesService.ts
// Why: API client for managing marketing pages in the admin dashboard.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { apiClient } from '@/lib/api-client.js';

export interface PageContent {
  id: string;
  slug: string;
  title: string;
  contentJson: any;
  updatedAt: string;
  createdAt: string;
}

export const adminPagesService = {
  /**
   * Fetch all editable marketing pages
   */
  getPages: async (): Promise<PageContent[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: PageContent[] }>('/api/admin/pages');
    return data.data;
  },

  /**
   * Update the content of a specific marketing page
   */
  updatePage: async (slug: string, payload: { title: string; contentJson: any }): Promise<PageContent> => {
    const { data } = await apiClient.put<{ success: boolean; data: PageContent }>(`/api/admin/pages/${slug}`, payload);
    return data.data;
  },

  /**
   * Fetch public page content (used by the marketing pages, not just admin)
   */
  getPublicPage: async (slug: string): Promise<PageContent> => {
    const { data } = await apiClient.get<{ success: boolean; data: PageContent }>(`/api/pages/${slug}`);
    return data.data;
  },
};
