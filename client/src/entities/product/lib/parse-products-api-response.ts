import type { Product } from '../model/types';
import { serverProductToProduct } from './adapters';

/** Ответы витрин маркетплейса: products | data.products | data[] */
export function parseProductsFromApiResponse(response: unknown): Product[] {
  if (!response || typeof response !== 'object') return [];
  const r = response as Record<string, unknown>;
  if (Array.isArray(r.products)) {
    return r.products.map((p) => serverProductToProduct(p as Product));
  }
  if (r.data && typeof r.data === 'object') {
    const d = r.data as Record<string, unknown>;
    if (Array.isArray(d.products)) {
      return d.products.map((p) => serverProductToProduct(p as Product));
    }
    if (Array.isArray(d)) {
      return d.map((p) => serverProductToProduct(p as Product));
    }
  }
  if (Array.isArray(r.data)) {
    return (r.data as unknown[]).map((p) => serverProductToProduct(p as Product));
  }
  return [];
}
