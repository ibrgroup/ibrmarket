import { CategoryService } from '@/shared/api/services/category-service';
import { ProductService } from '@/shared/api/services/product-service';
import {
  getRscApiForwardHeaders,
  incomingRequestHasAccessToken,
} from '@/shared/lib/rsc-api-headers';
import { dehydrate } from '@tanstack/react-query';
import { createPrefetchQueryClient } from './prefetch';

/**
 * Prefetch данные для страницы продуктов
 * Включает первую страницу продуктов, категории и бренды для фильтров
 */
export async function prefetchProductsPageData(filters?: {
  categories?: string[];
  brands?: string[];
  search?: string;
  page?: number;
}) {
  const queryClient = createPrefetchQueryClient();
  const forwardHeaders = await getRscApiForwardHeaders();
  const hasAuth = await incomingRequestHasAccessToken();

  // Prefetch категории (для фильтров)
  await queryClient.prefetchQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await CategoryService.getCategories(forwardHeaders);
        return response;
      } catch (error) {
        console.error('[Prefetch] Error fetching categories:', error);
        return { data: [] };
      }
    },
    staleTime: 60 * 1000,
  });

  // Prefetch бренды (для фильтров)
  // Важно: queryKey и queryFn должны совпадать с useBrands
  await queryClient.prefetchQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      try {
        // Используем тот же API endpoint, что и в useBrands (/api/brands - Next.js API route)
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/brands`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          return [];
        }

        const data = await response.json();

        // Валидация и маппинг данных в формат Brand (как в useBrands)
        if (!Array.isArray(data)) {
          return [];
        }

        return data
          .map((item: any) => ({
            value: typeof item.value === 'string' ? item.value : item._id?.toString() || '',
            label: typeof item.label === 'string' ? item.label : item.name || '',
            count: typeof item.count === 'number' ? item.count : 0,
            logo: typeof item.logo === 'string' ? item.logo : undefined,
          }))
          .filter((brand: any) => brand.value && brand.label)
          .sort((a: any, b: any) => a.label.localeCompare(b.label, 'ru'));
      } catch (error) {
        console.error('[Prefetch] Error fetching brands:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  // Prefetch первая страница продуктов
  await queryClient.prefetchQuery({
    queryKey: ['products', { ...filters, page: filters?.page || 1 }],
    queryFn: async () => {
      if (!hasAuth) {
        return { data: [], total: 0, totalPages: 1 };
      }
      try {
        const response = await ProductService.getProducts(
          {
            page: filters?.page || 1,
            limit: 20,
            ...(filters?.search && { search: filters.search }),
            ...(filters?.categories &&
              filters.categories.length > 0 && { categories: filters.categories }),
            ...(filters?.brands && filters.brands.length > 0 && { brands: filters.brands }),
          },
          forwardHeaders,
        );
        return response;
      } catch (error) {
        console.error('[Prefetch] Error fetching products:', error);
        return { data: [], total: 0, totalPages: 1 };
      }
    },
    staleTime: 30 * 1000, // 30 секунд
  });

  return dehydrate(queryClient);
}
