'use client';

import { DEFAULT_FILTER_STATE, type FilterState } from '@/features/product-filters';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

function readCategoriesFromParams(searchParams: URLSearchParams | null): string[] {
  const catsRaw = searchParams?.getAll('categories[]') ?? [];
  return catsRaw.map((c) => decodeURIComponent(c.trim())).filter(Boolean);
}

/**
 * Фильтры категорий на /search: синхронизация с URL, сохранение q и byImage.
 */
export function useSearchCategoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTER_STATE,
    categories: readCategoriesFromParams(searchParams),
  }));

  useEffect(() => {
    const categories = readCategoriesFromParams(searchParams);
    setFilters((prev) => {
      if (
        prev.categories.length === categories.length &&
        prev.categories.every((c, i) => c === categories[i])
      ) {
        return prev;
      }
      return { ...prev, categories };
    });
  }, [searchParams]);

  const handleFiltersChange = useCallback(
    (next: FilterState) => {
      setFilters(next);
      const params = new URLSearchParams();
      const q = searchParams?.get('q');
      if (q) params.set('q', q);
      if (searchParams?.get('byImage') === '1') params.set('byImage', '1');
      next.categories.forEach((cat) => params.append('categories[]', cat));
      const qs = params.toString();
      router.replace(qs ? `/search?${qs}` : '/search', { scroll: false });
    },
    [router, searchParams],
  );

  const handleRemoveCategory = useCallback(
    (value: string) => {
      handleFiltersChange({
        ...filters,
        categories: filters.categories.filter((c) => c !== value),
      });
    },
    [filters, handleFiltersChange],
  );

  const handleClearCategories = useCallback(() => {
    handleFiltersChange({ ...filters, categories: [] });
  }, [filters, handleFiltersChange]);

  const selectedCategories = useMemo(() => filters.categories, [filters.categories]);

  return {
    filters,
    selectedCategories,
    handleFiltersChange,
    handleRemoveCategory,
    handleClearCategories,
  };
}
