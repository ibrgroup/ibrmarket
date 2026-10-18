import { serverProductToProduct } from '@/entities/product/lib/adapters';
import { ProductService } from '@/shared/api/services/product-service';
import { reviewService } from '@/shared/api/services/review-service';
import { dehydrate } from '@tanstack/react-query';
import { createPrefetchQueryClient } from './prefetch';

/**
 * Prefetch данные для страницы детального просмотра продукта
 * Включает данные продукта и статистику отзывов
 */
export async function prefetchProductDetailData(productId: string) {
  if (!productId) {
    return null;
  }

  const queryClient = createPrefetchQueryClient();

  // Prefetch данные продукта
  await queryClient.prefetchQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      try {
        const response = await ProductService.getProductById(productId);
        if (response.product) {
          return serverProductToProduct(response.product);
        } else if (response.data) {
          return serverProductToProduct(response.data);
        } else {
          return serverProductToProduct(response);
        }
      } catch (error) {
        console.error('[Prefetch] Error fetching product:', error);
        return null;
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });

  // Prefetch статистика отзывов
  // Важно: queryKey и queryFn должны совпадать с useReviewStats
  await queryClient.prefetchQuery({
    queryKey: ['review-stats', productId],
    queryFn: async () => {
      try {
        // Пытаемся получить статистику напрямую (как в useReviewStats)
        const statsResponse = await reviewService.getReviewStats(productId);
        if (statsResponse && statsResponse.stats) {
          return statsResponse.stats;
        }
      } catch {
        // Если endpoint не существует, получаем все отзывы и вычисляем статистику
        // (логика из useReviewStats)
      }

      // Получаем все отзывы товара и вычисляем статистику
      try {
        const response = await reviewService.getReviews({
          productId,
          limit: 1000,
        });

        // Импортируем адаптеры для вычисления статистики
        const { adaptReviewsResponse, calculateReviewStats } = await import(
          '@/entities/review/lib/adapters'
        );
        const adaptedResponse = adaptReviewsResponse(response);
        return calculateReviewStats(adaptedResponse.reviews);
      } catch (error) {
        console.error('[Prefetch] Error fetching review stats:', error);
        // Возвращаем пустую статистику при ошибке
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 минут (как в useReviewStats)
  });

  return dehydrate(queryClient);
}
