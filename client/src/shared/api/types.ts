// Базовые типы для API ответов

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: boolean;
  errors?: Record<string, string[]>;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Пагинация
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Реальный формат ответа от сервера
export interface ServerProductResponse {
  error: boolean;
  success: boolean;
  products: any[]; // Массив продуктов
  total: number;
  page: number | null;
  totalPages: number;
  totalCount: number;
  totalProducts: any[]; // Дублирующий массив продуктов
}

// Фильтры товаров
export interface ProductFilters {
  category?: string;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  inStock?: boolean;
  search?: string;
}

// Сортировка товаров
export type ProductSort = 'name' | 'price' | 'rating' | 'createdAt' | 'popularity';

export interface ProductSortParams {
  sortBy: ProductSort;
  order: 'asc' | 'desc';
}

// Общие типы ошибок
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: ValidationError[];
}
