'use client';

import { useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PRODUCTS_PER_PAGE } from '@/features/product-filters';

interface UseProductsPaginationProps {
  totalProducts: number;
  paginationMode: 'pagination' | 'infinite';
}

/**
 * Хук для управления пагинацией продуктов
 */
export function useProductsPagination({
  totalProducts,
  paginationMode,
}: UseProductsPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Вычисляем currentPage напрямую из URL вместо состояния
  const currentPage = useMemo(() => {
    const pageParam = searchParams?.get('page');
    const pageNum =
      pageParam && !isNaN(Number(pageParam)) && Number(pageParam) > 0 ? Number(pageParam) : 1;
    return pageNum;
  }, [searchParams]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));

  const handlePageChange = useCallback(
    (page: number) => {
      if (currentPage === page) return;

      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('page', String(page));
      params.set('paginationMode', paginationMode);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, paginationMode, currentPage],
  );

  return {
    currentPage,
    totalPages,
    handlePageChange,
  };
}
