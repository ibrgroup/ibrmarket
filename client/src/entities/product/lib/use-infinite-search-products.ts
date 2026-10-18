import type { InfiniteProductResponse } from '@/entities/product';
import { parseSearchProductsResponse } from '@/entities/product/lib/parse-search-products-response';
import { ProductService } from '@/shared/api/services/product-service';
import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';

const SEARCH_PAGE_SIZE = 20;

export type SearchProductsOptions = {
  categories?: string[];
};

export function useInfiniteSearchProducts(query: string, options?: SearchProductsOptions) {
  const trimmed = query.trim();
  const categories = options?.categories?.filter(Boolean) ?? [];
  const categoriesKey = categories.slice().sort().join(',');

  return useInfiniteQuery<
    InfiniteProductResponse,
    Error,
    InfiniteData<InfiniteProductResponse>,
    ['infinite-search', string, string],
    number
  >({
    queryKey: ['infinite-search', trimmed, categoriesKey],
    enabled: trimmed.length > 0,
    queryFn: async ({ pageParam = 1 }) => {
      const page = typeof pageParam === 'number' && pageParam > 0 ? pageParam : 1;
      const response = await ProductService.searchProducts(trimmed, {
        page,
        limit: SEARCH_PAGE_SIZE,
        categories: categories.length > 0 ? categories : undefined,
      });
      const parsed = parseSearchProductsResponse(response, SEARCH_PAGE_SIZE);
      const hasMore = page < parsed.totalPages;

      return {
        products: parsed.products,
        total: parsed.total,
        totalPages: parsed.totalPages,
        page,
        hasMore,
        nextPage: hasMore ? page + 1 : undefined,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
