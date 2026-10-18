import type { Product } from '@/entities/product/model/types';
import { apiClient } from '../client';

interface AdminProductsResponse {
  products?: Product[];
  total?: number;
  page?: number;
  totalPages?: number;
  success?: boolean;
  error?: boolean;
}

interface ProductOneResponse {
  product?: Product;
  success?: boolean;
}

export interface AdminProductsFilter {
  q?: string;
  category?: string;
  /** out — нет в наличии, low — остаток 1–5 */
  stock?: 'out' | 'low';
  featured?: boolean;
}

class AdminProductsService {
  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<ProductOneResponse>(`/api/product/${id}`);
    const raw = (response.data ?? response) as ProductOneResponse;
    const p = raw.product;
    if (!p?._id) {
      throw new Error('Товар не найден');
    }
    return p;
  }

  async create(body: Record<string, unknown>): Promise<void> {
    await apiClient.post('/api/product/create', body);
  }

  async update(id: string, body: Record<string, unknown>): Promise<void> {
    await apiClient.put(`/api/product/updateProduct/${id}`, body);
  }

  async delete(productId: string): Promise<void> {
    await apiClient.delete(`/api/product/${productId}`);
  }

  async deleteMultiple(ids: string[]): Promise<void> {
    await apiClient.delete('/api/product/deleteMultiple', { ids });
  }

  async bulkSetFeatured(ids: string[], isFeatured: boolean): Promise<void> {
    await apiClient.patch('/api/product/bulk', { ids, isFeatured });
  }

  async list(
    page = 1,
    limit = 20,
    filter: AdminProductsFilter = {},
    sort = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<{ products: Product[]; total: number; totalPages: number }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filter.q?.trim()) params.set('q', filter.q.trim());
    if (filter.category?.trim()) params.set('category', filter.category.trim());
    if (filter.stock) params.set('stock', filter.stock);
    if (typeof filter.featured === 'boolean') params.set('featured', String(filter.featured));
    if (sort?.trim()) params.set('sort', sort.trim());
    params.set('order', order);
    const response = await apiClient.get<AdminProductsResponse>(`/api/admin/products?${params}`);
    const raw = (response.data ?? response) as AdminProductsResponse;
    return {
      products: raw.products ?? [],
      total: raw.total ?? 0,
      totalPages: raw.totalPages ?? 1,
    };
  }
}

export const adminProductsService = new AdminProductsService();
