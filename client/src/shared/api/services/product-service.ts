import type { Product } from '@/entities/product';
import { apiClient } from '../client';
import type { ApiResponse, PaginationParams } from '../types';

/**
 * Параметры для получения продуктов с бэка
 */
export interface GetProductsParams extends PaginationParams {
  categories?: string[];
  brands?: string[];
  priceRange?: [number, number];
  rating?: number;
  inStock?: boolean | null;
  sortBy?: 'price' | 'name' | 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Для создания продукта
 */
export interface CreateProductData {
  title: string;
  category: string;
  price: number;
  imageSrc: string;
  description?: string;
}

/**
 * Для обновления продукта (Partial кроме id)
 */
export interface UpdateProductData extends Partial<CreateProductData> {
  _id: string;
}

/**
 * Сервис продуктов, методы возвращают промисы с сырой структурой, адаптация на клиенте
 */
export class ProductService {
  /**
   * Валидация параметров запроса
   */
  private static validateParams(params: GetProductsParams): void {
    if (params.minPrice !== undefined && params.minPrice < 0) {
      throw new Error('minPrice не может быть отрицательным');
    }
    if (params.maxPrice !== undefined && params.maxPrice < 0) {
      throw new Error('maxPrice не может быть отрицательным');
    }
    if (
      params.minPrice !== undefined &&
      params.maxPrice !== undefined &&
      params.minPrice > params.maxPrice
    ) {
      throw new Error('minPrice не может быть больше maxPrice');
    }
    if (params.rating !== undefined && (params.rating < 0 || params.rating > 5)) {
      throw new Error('rating должен быть в диапазоне от 0 до 5');
    }
    if (params.limit !== undefined && params.limit < 1) {
      throw new Error('limit должен быть больше 0');
    }
    if (params.page !== undefined && params.page < 1) {
      throw new Error('page должен быть больше 0');
    }
  }

  /**
   * Получить список продуктов (сырые данные, возможно различные структуры: {data: ...}, {products: ...}, массив)
   * @param requestHeaders — для RSC/prefetch: Cookie / Authorization с входящего запроса Next
   */
  static async getProducts(
    params?: GetProductsParams,
    requestHeaders?: Record<string, string>,
  ): Promise<any> {
    // Валидация параметров
    if (params) {
      this.validateParams(params);
    }

    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }

        // Обработка массивов категорий
        if (key === 'categories' && Array.isArray(value)) {
          // Фильтруем пустые строки и добавляем только валидные значения
          const validCategories = value.filter(
            (cat) => typeof cat === 'string' && cat.trim().length > 0,
          );
          if (validCategories.length > 0) {
            validCategories.forEach((cat) => {
              // URLSearchParams сам кодирует значения; ручной encodeURIComponent
              // приводит к двойному кодированию (%25..) и некорректным запросам.
              queryParams.append('categories[]', cat.trim());
            });
          }
        }
        // Обработка массивов брендов
        else if (key === 'brands' && Array.isArray(value)) {
          // Фильтруем пустые строки и добавляем только валидные значения
          const validBrands = value.filter(
            (brand) => typeof brand === 'string' && brand.trim().length > 0,
          );
          if (validBrands.length > 0) {
            validBrands.forEach((brand) => {
              queryParams.append('brands[]', brand.trim());
            });
          }
        }
        // Обработка диапазона цен
        else if (key === 'priceRange' && Array.isArray(value) && value.length === 2) {
          const [minPrice, maxPrice] = value;
          if (
            typeof minPrice === 'number' &&
            typeof maxPrice === 'number' &&
            minPrice >= 0 &&
            maxPrice >= minPrice
          ) {
            queryParams.append('minPrice', minPrice.toString());
            queryParams.append('maxPrice', maxPrice.toString());
          }
        }
        // Обработка одиночной категории
        else if (key === 'category' && typeof value === 'string') {
          const trimmedCategory = value.trim();
          if (trimmedCategory.length > 0) {
            queryParams.append('category', trimmedCategory);
          }
        }
        // Обработка minPrice и maxPrice (если переданы отдельно, а не через priceRange)
        else if (key === 'minPrice' && typeof value === 'number' && value >= 0) {
          queryParams.append('minPrice', value.toString());
        } else if (key === 'maxPrice' && typeof value === 'number' && value >= 0) {
          queryParams.append('maxPrice', value.toString());
        }
        // Обработка остальных параметров
        else if (
          key !== 'categories' &&
          key !== 'brands' &&
          key !== 'priceRange' &&
          key !== 'category' &&
          key !== 'minPrice' &&
          key !== 'maxPrice'
        ) {
          // Пропускаем null, но не undefined
          if (value !== null && value !== '') {
            const stringValue = String(value).trim();
            if (stringValue.length > 0) {
              queryParams.append(key, stringValue);
            }
          }
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/api/product/getAllProducts?${queryString}`
      : '/api/product/getAllProducts';
    // Возвращаем raw response, логика обработки (products/data/array) переносится в use-products.ts
    return apiClient.get(endpoint, requestHeaders);
  }

  /**
   * Получить продукт по ID (сырые данные, адаптер вызывается в useProduct)
   */
  static async getProductById(id: string): Promise<any> {
    return apiClient.get(`/api/product/${id}`);
  }

  /**
   * Создать новый продукт
   */
  static async createProduct(data: CreateProductData): Promise<ApiResponse<Product>> {
    return apiClient.post<Product>('/api/product/create', data);
  }

  /**
   * Обновить продукт
   */
  static async updateProduct(data: UpdateProductData): Promise<ApiResponse<Product>> {
    const { _id, ...updateData } = data;
    return apiClient.put<Product>(`/api/product/updateProduct/${_id}`, updateData);
  }

  /**
   * Удалить продукт
   */
  static async deleteProduct(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/product/${id}`);
  }

  /**
   * Поиск продуктов (raw response, адаптация на клиенте)
   */
  static async searchProducts(
    query: string,
    options?: { page?: number; limit?: number; categories?: string[] },
  ): Promise<any> {
    // POST `/api/product/search/get`, возвращает разные структуры
    // Бэкенд ожидает поле 'query', а не 'q'
    if (!query || typeof query !== 'string') {
      throw new Error('Query is required for search and must be a string');
    }
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      throw new Error('Query cannot be empty');
    }
    if (trimmedQuery.length > 200) {
      throw new Error('Query is too long (max 200 characters)');
    }
    return apiClient.post(`/api/product/search/get`, {
      query: trimmedQuery,
      page: options?.page ?? 1,
      limit: options?.limit ?? 100,
      ...(options?.categories?.length ? { categories: options.categories } : {}),
    });
  }

  /**
   * Автозаполнение поиска
   */
  static async autocompleteSearch(query: string, limit: number = 5): Promise<any> {
    if (!query || typeof query !== 'string') {
      throw new Error('Query is required for autocomplete and must be a string');
    }
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      throw new Error('Query cannot be empty');
    }
    if (limit < 1 || limit > 50) {
      throw new Error('Limit must be between 1 and 50');
    }
    return apiClient.get(
      `/api/search/autocomplete?q=${encodeURIComponent(trimmedQuery)}&limit=${limit}`,
    );
  }

  /**
   * Получить избранные товары (featured), raw response, обработка на клиенте
   */
  static async getFeatured(): Promise<any> {
    return apiClient.get(`/api/product/getAllFeaturedProducts`);
  }

  /** Популярные товары для витрин (корзина, избранное, профиль) */
  static async getPopularProducts(limit: number = 24): Promise<any> {
    const q = new URLSearchParams({ limit: String(limit) });
    return apiClient.get(`/api/product/getPopularProducts?${q}`);
  }

  /** Похожие товары по категории + добор популярных */
  static async getSimilarProducts(productId: string, limit: number = 16): Promise<any> {
    const q = new URLSearchParams({ limit: String(limit) });
    return apiClient.get(`/api/product/${encodeURIComponent(productId)}/similar?${q}`);
  }

  /** Рекомендации по истории заказов; для гостя — как популярные */
  static async getRecommendedForYou(limit: number = 16): Promise<any> {
    const q = new URLSearchParams({ limit: String(limit) });
    return apiClient.get(`/api/product/getRecommendedForYou?${q}`);
  }

  /**
   * Получить баннеры товаров (обычно { images: [...] })
   */
  static async getProductBanners(requestHeaders?: Record<string, string>): Promise<any> {
    return apiClient.get(`/api/product/getAllProductsBanners`, requestHeaders);
  }

  /**
   * Фильтрация (по серверному контракту — POST /filters, raw response)
   */
  static async filterProducts(payload: Record<string, unknown>): Promise<any> {
    return apiClient.post(`/api/product/filters`, payload);
  }

  /**
   * Сортировка (по серверному контракту — POST /sortBy, raw response)
   */
  static async sortProducts(payload: { field: string; order: 'asc' | 'desc' }): Promise<any> {
    return apiClient.post(`/api/product/sortBy`, payload);
  }
}
