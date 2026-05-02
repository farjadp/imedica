// ============================================================================
// File: apps/web/src/features/admin/services/aiService.ts
// Version: 1.0.0
// Why: API wrapper for AI Knowledge Base operations.
// ============================================================================

import { apiClient } from '@/lib/api-client.js';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface AiDocument {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  url: string | null;
  uploadedById: string | null;
  createdAt: string;
  updatedAt: string;
  chunkCount: number;
}

export const aiService = {
  async getDocuments(): Promise<AiDocument[]> {
    const response = await apiClient.get<ApiResponse<AiDocument[]>>('/api/admin/ai/documents');
    return response.data.data;
  },

  async uploadFile(title: string, description: string, file: File): Promise<AiDocument> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<AiDocument>>('/api/admin/ai/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async uploadHuggingFace(title: string, description: string, url: string): Promise<AiDocument> {
    const response = await apiClient.post<ApiResponse<AiDocument>>('/api/admin/ai/huggingface', {
      title,
      description,
      url,
    });
    return response.data.data;
  },

  async deleteDocument(id: string): Promise<AiDocument> {
    const response = await apiClient.delete<ApiResponse<AiDocument>>(`/api/admin/ai/documents/${id}`);
    return response.data.data;
  },
};
