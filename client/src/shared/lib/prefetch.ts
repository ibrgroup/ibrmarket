import { CategoryService } from '@/shared/api/services/category-service';
import { ProductService } from '@/shared/api/services/product-service';
import {
  getRscApiForwardHeaders,
  incomingRequestHasAccessToken,
} from '@/shared/lib/rsc-api-headers';
import { QueryClient, dehydrate } from '@tanstack/react-query';

/**
 * Создает новый QueryClient для серверного prefetch
 * Используется в Server Components для предзагрузки данных
 * Конфигурация должна совпадать с QueryProvider для консистентности
 */
export function createPrefetchQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute - совпадает с QueryProvider
        gcTime: 5 * 60 * 1000, // 5 minutes - совпадает с QueryProvider
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && 'status' in error) {
            const status = (error as any).status;
            if (status >= 400 && status < 500) {
              return false;
            }
          }
          return failureCount < 3;
        },
      },
    },
  });
}

/**
 * Prefetch данные для главной страницы
 * Включает баннеры продуктов и категории
 *
 * Важно: queryKey и queryFn должны точно совпадать с хуками useProductBanners и useCategories
 * для правильной работы hydration без подергиваний
 */
export async function prefetchHomePageData() {
  const queryClient = createPrefetchQueryClient();
  const forwardHeaders = await getRscApiForwardHeaders();
  const hasAuth = await incomingRequestHasAccessToken();

  // Prefetch баннеры продуктов
  // queryKey и queryFn должны совпадать с useProductBanners
  await queryClient.prefetchQuery({
    queryKey: ['products', 'banners'],
    queryFn: async () => {
      // Бэкенд требует JWT; без cookie accessToken запрос даёт 401 и забивает логи
      if (!hasAuth) {
        return [];
      }
      try {
        const response = await ProductService.getProductBanners(forwardHeaders);
        return response.data?.images || [];
      } catch (error) {
        // Возвращаем пустой массив при ошибке, чтобы не ломать hydration
        console.error('[Prefetch] Error fetching banners:', error);
        return [];
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });

  // Prefetch категории
  // queryKey и queryFn должны совпадать с useCategories
  // Важно: useCategories использует select: (data) => data.data
  // Поэтому prefetch должен возвращать полный response, а не только data
  await queryClient.prefetchQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await CategoryService.getCategories(forwardHeaders);
        // Возвращаем полный response, так как useCategories использует select
        return response;
      } catch (error) {
        // Возвращаем объект с пустым data при ошибке
        console.error('[Prefetch] Error fetching categories:', error);
        return { data: [] };
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });

  return dehydrate(queryClient);
}
