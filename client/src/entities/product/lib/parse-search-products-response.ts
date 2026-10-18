import { devLog } from '@/shared/lib/logger';
import type { Product } from '../model/types';
import { serverProductToProduct } from './adapters';

export interface ParsedSearchProductsResult {
  products: Product[];
  total: number;
  totalPages: number;
}

/**
 * Разбирает ответ POST `/api/product/search/get` (несколько возможных форматов).
 * Должен совпадать с логикой в useProducts при params.search.
 */
export function parseSearchProductsResponse(
  response: unknown,
  limit: number = 20,
): ParsedSearchProductsResult {
  let rawList: unknown[] = [];
  let total = 0;
  let totalPages = 1;

  const r = response as Record<string, unknown> & { data?: Record<string, unknown> };

  if (r.data?.products && Array.isArray(r.data.products)) {
    rawList = r.data.products as unknown[];
    total =
      (typeof r.data.total === 'number' ? r.data.total : undefined) ??
      (typeof r.data.totalCount === 'number' ? r.data.totalCount : undefined) ??
      rawList.length;
    totalPages =
      (typeof r.data.totalPages === 'number' ? r.data.totalPages : undefined) ??
      Math.ceil(total / limit);
  } else if (Array.isArray(r.data)) {
    rawList = r.data as unknown[];
    total = rawList.length;
    totalPages = 1;
  } else if (r.products && Array.isArray(r.products)) {
    rawList = r.products as unknown[];
    total =
      (typeof r.total === 'number' ? r.total : undefined) ??
      (typeof r.totalCount === 'number' ? r.totalCount : undefined) ??
      rawList.length;
    totalPages =
      (typeof r.totalPages === 'number' ? r.totalPages : undefined) ?? Math.ceil(total / limit);
  } else if (Array.isArray(response)) {
    rawList = response as unknown[];
    total = rawList.length;
    totalPages = 1;
  } else {
    devLog.warn('Неожиданный формат ответа для поиска:', response);
  }

  return {
    products: rawList.map((p) => serverProductToProduct(p as Product)),
    total,
    totalPages,
  };
}

/** Ровно один товар в выдаче поиска — можно вести на карточку (артикул / уникальный запрос). */
export function isSingleSearchHit(result: ParsedSearchProductsResult): boolean {
  return result.total === 1 && result.products.length === 1 && Boolean(result.products[0]?._id);
}
