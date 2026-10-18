'use client';

import type { FilterState } from '@/features/product-filters';
import { DEFAULT_FILTER_STATE, PRICE_RANGE, PRODUCTS_PER_PAGE } from '@/features/product-filters';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Хук для управления фильтрами продуктов с синхронизацией URL
 */
export function useProductsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Refs для предотвращения циклических обновлений
  const isInitialMount = useRef(true);
  const isUpdatingFromURL = useRef(false);
  const lastFiltersRef = useRef<FilterState>(DEFAULT_FILTER_STATE);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [paginationMode, setPaginationMode] = useState<'pagination' | 'infinite'>('infinite');

  // Локальное состояние фильтров для немедленного обновления UI
  const [localFilters, setLocalFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);

  // Debounced фильтры для API запросов
  const [debouncedFilters, setDebouncedFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);

  // Debounce для всех фильтров (500ms)
  useEffect(() => {
    // Пропускаем debounce при начальной загрузке или обновлении из URL
    if (isInitialMount.current || isUpdatingFromURL.current) {
      return;
    }

    // Очищаем предыдущий таймер
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Устанавливаем новый таймер
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedFilters(localFilters);
    }, 500);

    // Очистка при размонтировании или изменении
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [localFilters]);

  // Синхронизация фильтров с URL при монтировании и изменении URL
  useEffect(() => {
    if (isUpdatingFromURL.current) {
      isUpdatingFromURL.current = false;
      return;
    }

    const urlFilters: Partial<FilterState> = {};

    // Обработка категорий из URL
    const cat = searchParams?.get('category');
    const catsRaw = searchParams?.getAll('categories[]');

    if (catsRaw && catsRaw.length > 0) {
      urlFilters.categories = catsRaw.map((c) => decodeURIComponent(c.trim())).filter(Boolean);
    } else if (typeof cat === 'string' && cat.trim().length > 0) {
      urlFilters.categories = [decodeURIComponent(cat.trim())];
    }

    // Обработка брендов из URL
    const brandsRaw = searchParams?.getAll('brands[]');
    const brandsRawAlt = searchParams?.getAll('brand');
    const brandsArray =
      brandsRaw && brandsRaw.length > 0
        ? brandsRaw
        : brandsRawAlt && brandsRawAlt.length > 0
          ? brandsRawAlt
          : [];

    if (brandsArray.length > 0) {
      urlFilters.brands = brandsArray.map((b) => decodeURIComponent(b.trim())).filter(Boolean);
    }

    const ratingRaw = searchParams?.get('rating');
    const parsedRating =
      typeof ratingRaw === 'string' && !isNaN(Number(ratingRaw)) ? Number(ratingRaw) : undefined;
    if (typeof parsedRating === 'number' && parsedRating > 0) {
      urlFilters.rating = parsedRating;
    }

    const priceMinRaw = searchParams?.get('priceMin');
    const priceMaxRaw = searchParams?.get('priceMax');
    const hasPriceMin =
      typeof priceMinRaw === 'string' && priceMinRaw.length > 0 && !isNaN(Number(priceMinRaw));
    const hasPriceMax =
      typeof priceMaxRaw === 'string' && priceMaxRaw.length > 0 && !isNaN(Number(priceMaxRaw));

    if (hasPriceMin || hasPriceMax) {
      const minValue = hasPriceMin ? Number(priceMinRaw) : PRICE_RANGE.min;
      const maxValue = hasPriceMax ? Number(priceMaxRaw) : PRICE_RANGE.max;
      if (minValue <= maxValue && minValue >= 0 && maxValue >= 0) {
        urlFilters.priceRange = [minValue, maxValue];
      }
    }

    const inStockRaw = searchParams?.get('inStock');
    if (inStockRaw === '1' || inStockRaw === '0') {
      urlFilters.inStock = inStockRaw === '1';
    }

    const sortByRaw = searchParams?.get('sortBy');
    const allowedSortBy: FilterState['sortBy'][] = ['name', 'price', 'rating', 'createdAt'];
    if (
      typeof sortByRaw === 'string' &&
      allowedSortBy.includes(sortByRaw as FilterState['sortBy'])
    ) {
      urlFilters.sortBy = sortByRaw as FilterState['sortBy'];
    }

    const sortOrderRaw = searchParams?.get('sortOrder');
    const allowedSortOrder: FilterState['sortOrder'][] = ['asc', 'desc'];
    if (
      typeof sortOrderRaw === 'string' &&
      allowedSortOrder.includes(sortOrderRaw as FilterState['sortOrder'])
    ) {
      urlFilters.sortOrder = sortOrderRaw as FilterState['sortOrder'];
    }

    const newFilters = { ...DEFAULT_FILTER_STATE, ...urlFilters };
    const hasChanges = Object.keys(urlFilters).length > 0;

    if (hasChanges || isInitialMount.current) {
      const keys = Object.keys(newFilters) as (keyof FilterState)[];
      const prevFilters = localFilters;
      const changed = keys.some((key) => {
        const nextVal = newFilters[key];
        const prevVal = prevFilters[key];
        if (Array.isArray(nextVal) && Array.isArray(prevVal)) {
          if (nextVal.length !== prevVal.length) return true;
          return nextVal.some((v, i) => v !== prevVal[i]);
        }
        return prevVal !== nextVal;
      });

      if (changed || isInitialMount.current) {
        const updatedFilters = { ...prevFilters, ...newFilters };
        lastFiltersRef.current = updatedFilters;
        // Синхронизируем локальное состояние фильтров и debounced версию
        setLocalFilters(updatedFilters);
        // При загрузке из URL сразу обновляем debounced версию (без задержки)
        if (isInitialMount.current) {
          setDebouncedFilters(updatedFilters);
        }
        isInitialMount.current = false;
      }

      const noQuery =
        (!cat || cat.trim().length === 0) &&
        (!catsRaw || catsRaw.length === 0) &&
        (!brandsRaw || brandsRaw.length === 0) &&
        (!brandsRawAlt || brandsRawAlt.length === 0) &&
        !ratingRaw &&
        !hasPriceMin &&
        !hasPriceMax &&
        inStockRaw == null &&
        !sortByRaw &&
        !sortOrderRaw;

      if (noQuery && !isInitialMount.current && !changed) {
        lastFiltersRef.current = DEFAULT_FILTER_STATE;
        setLocalFilters(DEFAULT_FILTER_STATE);
        setDebouncedFilters(DEFAULT_FILTER_STATE);
      }
    }

    isInitialMount.current = false;
  }, [searchParams]);

  // Синхронизация paginationMode с URL (по умолчанию — infinite scroll)
  useEffect(() => {
    const paginationModeParam = searchParams?.get('paginationMode');
    const nextMode: 'pagination' | 'infinite' =
      paginationModeParam === 'pagination' ? 'pagination' : 'infinite';
    if (paginationMode !== nextMode) {
      setPaginationMode(nextMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Внутренняя функция для обновления URL и фильтров
  const updateFiltersAndURL = useCallback(
    (filtersToUse: FilterState) => {
      const hasRealChanges = Object.keys(filtersToUse).some((key) => {
        const newVal = filtersToUse[key as keyof FilterState];
        const prevVal = lastFiltersRef.current[key as keyof FilterState];
        if (Array.isArray(newVal) && Array.isArray(prevVal)) {
          if (newVal.length !== prevVal.length) return true;
          return newVal.some((v, i) => v !== prevVal[i]);
        }
        return newVal !== prevVal;
      });

      if (!hasRealChanges && !isInitialMount.current) {
        return;
      }

      lastFiltersRef.current = filtersToUse;
      isUpdatingFromURL.current = true;

      const params = new URLSearchParams();

      filtersToUse.categories.forEach((cat) => {
        // URLSearchParams сам корректно экранирует значения; не кодируем вручную,
        // иначе получаем двойное кодирование и сломанную фильтрацию.
        params.append('categories[]', cat);
      });

      filtersToUse.brands.forEach((brand) => {
        params.append('brands[]', brand);
      });

      if (
        filtersToUse.priceRange[0] !== PRICE_RANGE.min ||
        filtersToUse.priceRange[1] !== PRICE_RANGE.max
      ) {
        params.set('priceMin', String(filtersToUse.priceRange[0]));
        params.set('priceMax', String(filtersToUse.priceRange[1]));
      }

      if (filtersToUse.rating > 0) {
        params.set('rating', String(filtersToUse.rating));
      }

      if (typeof filtersToUse.inStock === 'boolean') {
        params.set('inStock', filtersToUse.inStock ? '1' : '0');
      }

      if (filtersToUse.sortBy !== 'name' || filtersToUse.sortOrder !== 'asc') {
        params.set('sortBy', filtersToUse.sortBy);
        params.set('sortOrder', filtersToUse.sortOrder);
      }

      if (paginationMode === 'pagination') {
        params.set('page', '1');
        params.set('paginationMode', 'pagination');
      }

      const newUrl = params.toString().length > 0 ? `?${params.toString()}` : '/products';
      router.replace(newUrl, { scroll: false });
    },
    [router, paginationMode],
  );

  // Обработчик изменения фильтров
  // Обновляет локальное состояние немедленно для UI, но запросы к API будут через debounce
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    // Обновляем локальное состояние немедленно для отзывчивого UI
    setLocalFilters(newFilters);
  }, []);

  // Синхронизация debounced фильтров с URL и API
  useEffect(() => {
    // Пропускаем обновление, если это обновление из URL
    if (isUpdatingFromURL.current) {
      return;
    }

    // Проверяем, что debounced фильтры отличаются от последних примененных
    // и что это не начальное значение
    if (!isInitialMount.current) {
      // Обновляем URL с debounced фильтрами
      updateFiltersAndURL(debouncedFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Преобразование фильтров в параметры API (без page, он передается отдельно)
  // Используем debounced фильтры для API запросов, чтобы уменьшить количество запросов
  const apiFilters = useMemo(() => {
    const params: Record<string, any> = {
      limit: PRODUCTS_PER_PAGE,
    };

    if (debouncedFilters.categories?.length) {
      params.categories = debouncedFilters.categories;
    }
    if (debouncedFilters.brands?.length) {
      params.brands = debouncedFilters.brands;
    }
    if (
      debouncedFilters.priceRange &&
      Array.isArray(debouncedFilters.priceRange) &&
      debouncedFilters.priceRange.length === 2
    ) {
      const [minPrice, maxPrice] = debouncedFilters.priceRange;
      params.minPrice = minPrice;
      params.maxPrice = maxPrice;
    }
    if (typeof debouncedFilters.rating === 'number' && debouncedFilters.rating > 0) {
      params.rating = debouncedFilters.rating;
    }
    if (typeof debouncedFilters.inStock === 'boolean') {
      params.inStock = debouncedFilters.inStock;
    }
    if (debouncedFilters.sortBy) {
      params.sortBy = debouncedFilters.sortBy;
    }
    if (debouncedFilters.sortOrder) {
      params.sortOrder = debouncedFilters.sortOrder;
    }

    return params;
  }, [debouncedFilters]);

  return {
    filters: localFilters, // Возвращаем локальные фильтры для немедленного обновления UI
    paginationMode,
    apiFilters, // Использует debounced фильтры для API запросов
    handleFiltersChange,
  };
}
