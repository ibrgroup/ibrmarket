'use client';

import { useMemo } from 'react';
import type { FilterState } from '../../model/types';
import { isPriceRangeActive } from '../utils';

/**
 * Хук для подсчета количества активных фильтров
 *
 * @param filters - Текущее состояние фильтров
 * @returns Количество активных фильтров
 *
 * @example
 * ```tsx
 * const activeCount = useActiveFiltersCount(filters);
 * ```
 */
export function useActiveFiltersCount(filters: FilterState): number {
  return useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.brands.length > 0) count++;
    if (isPriceRangeActive(filters.priceRange)) count++;
    if (filters.rating > 0) count++;
    if (filters.inStock !== null) count++;
    return count;
  }, [filters]);
}
