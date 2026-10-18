import type { Category } from '@/entities/category';
import { apiClient } from '../client';
import type { ApiResponse } from '../types';

export interface CreateCategoryData {
  name: string;
  icon: string;
  description?: string;
  parentId?: number;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: number;
}

export class CategoryService {
  /**
   * Получить все категории
   */
  static async getCategories(
    requestHeaders?: Record<string, string>,
  ): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('/api/category/', requestHeaders);
  }

  /**
   * Получить категорию по ID
   */
  static async getCategoryById(id: number): Promise<ApiResponse<Category>> {
    return apiClient.get<Category>(`/api/category/${id}`);
  }

  /**
   * Создать новую категорию
   */
  static async createCategory(data: CreateCategoryData): Promise<ApiResponse<Category>> {
    return apiClient.post<Category>('/api/category/create', data);
  }

  /**
   * Обновить категорию
   */
  static async updateCategory(data: UpdateCategoryData): Promise<ApiResponse<Category>> {
    return apiClient.put<Category>(`/api/category/${data.id}`, data);
  }

  /**
   * Удалить категорию
   */
  static async deleteCategory(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/category/${id}`);
  }

  /**
   * Получить количество категорий
   */
  static async getCategoriesCount(): Promise<ApiResponse<{ count: number }>> {
    return apiClient.get<{ count: number }>(`/api/category/get/count`);
  }

  /**
   * Получить количество подкатегорий
   */
  static async getSubCategoriesCount(): Promise<ApiResponse<{ count: number }>> {
    return apiClient.get<{ count: number }>(`/api/category/get/count/subCat`);
  }
}
