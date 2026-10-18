import { apiClient } from '../client';

export interface AdminCategoryRow {
  _id: string;
  name: string;
  parentId?: string | null;
  images?: string[];
  createdAt?: string;
}

interface AdminCategoriesResponse {
  categories?: AdminCategoryRow[];
  total?: number;
  success?: boolean;
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/240x240/png?text=Category';

class AdminCategoryService {
  async list(): Promise<AdminCategoryRow[]> {
    const response = await apiClient.get<AdminCategoriesResponse>('/api/admin/categories');
    const raw = (response.data ?? response) as AdminCategoriesResponse;
    return raw.categories ?? [];
  }

  async create(payload: {
    name: string;
    parentId?: string | null;
    images?: string[];
  }): Promise<void> {
    await apiClient.post('/api/category/create', {
      name: payload.name.trim(),
      parentId: payload.parentId || undefined,
      images:
        payload.images && payload.images.length > 0 ? payload.images : [PLACEHOLDER_IMAGE],
    });
  }

  async update(
    id: string,
    payload: { name?: string; parentId?: string | null; images?: string[] },
  ): Promise<void> {
    await apiClient.put(`/api/category/${id}`, payload);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/category/${id}`);
  }
}

export const adminCategoryService = new AdminCategoryService();
