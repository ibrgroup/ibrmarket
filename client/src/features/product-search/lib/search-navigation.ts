import { isSingleSearchHit, parseSearchProductsResponse } from '@/entities/product';
import { ProductService } from '@/shared/api/services/product-service';
import type { QueryClient } from '@tanstack/react-query';

/** Совпадает с лимитом на странице поиска — один ключ кэша React Query с `useProducts`. */
const SEARCH_LISTING_PARAMS = { limit: 24, page: 1 } as const;

/**
 * Если по запросу ровно один товар — путь карточки; иначе null (идти на страницу поиска).
 * Передайте `queryClient`, чтобы результат поиска попал в кэш и при переходе на `/search` не было второго запроса.
 */
export async function getProductPathForSingleSearchHit(
  query: string,
  queryClient?: QueryClient,
): Promise<string | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const params = { search: trimmed, ...SEARCH_LISTING_PARAMS };

  const fetchListing = async () => {
    const response = await ProductService.searchProducts(trimmed, {
      page: SEARCH_LISTING_PARAMS.page,
      limit: SEARCH_LISTING_PARAMS.limit,
    });
    return parseSearchProductsResponse(response, SEARCH_LISTING_PARAMS.limit);
  };

  try {
    const parsed = queryClient
      ? await queryClient.fetchQuery({
          queryKey: ['products', params],
          queryFn: fetchListing,
        })
      : await fetchListing();

    if (isSingleSearchHit(parsed)) {
      return `/product/${parsed.products[0]._id}`;
    }
  } catch {
    // fallback: обычная страница поиска
  }
  return null;
}

export function searchListingPath(query: string): string {
  return `/search?q=${encodeURIComponent(query.trim())}`;
}
