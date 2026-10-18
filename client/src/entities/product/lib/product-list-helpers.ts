import type { Product } from '../model/types';

/** Убрать товары с id из множества (например, не дублировать рекомендации с популярными). */
export function excludeProductIds(products: Product[], excludeIds: Set<string>): Product[] {
  if (excludeIds.size === 0) return products;
  return products.filter((p) => p._id && !excludeIds.has(String(p._id)));
}
