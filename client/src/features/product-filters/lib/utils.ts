import { PRICE_RANGE } from '../model/constants';
import type { FilterState } from '../model/types';

/**
 * Проверяет, активен ли ценовой диапазон (отличается от дефолтного)
 */
export function isPriceRangeActive(priceRange: [number, number]): boolean {
  return priceRange[0] > PRICE_RANGE.min || priceRange[1] < PRICE_RANGE.max;
}

/**
 * Проверяет, есть ли активные фильтры
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    isPriceRangeActive(filters.priceRange) ||
    filters.rating > 0 ||
    filters.inStock !== null
  );
}
