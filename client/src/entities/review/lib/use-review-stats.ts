import { reviewService } from '@/shared/api/services/review-service';
import { useQuery } from '@tanstack/react-query';
import type { ReviewStats } from '../model/types';
import { adaptReviewsResponse, calculateReviewStats } from './adapters';

/**
 * Хук для получения статистики отзывов товара
 * Вычисляет средний рейтинг и распределение по звездам
 */
export function useReviewStats(productId: string) {
  return useQuery<ReviewStats>({
    queryKey: ['review-stats', productId],
    queryFn: async () => {
      try {
        // Пытаемся получить статистику напрямую (если endpoint существует)
        const statsResponse = await reviewService.getReviewStats(productId);
        if (statsResponse && statsResponse.stats) {
          return statsResponse.stats;
        }
      } catch {
        // Если endpoint не существует, получаем все отзывы и вычисляем статистику
        // Статистика будет вычислена ниже из массива отзывов
      }

      // Получаем все отзывы товара и вычисляем статистику
      try {
        const response = await reviewService.getReviews({
          productId,
          limit: 1000, // Получаем достаточно отзывов для точной статистики
        });

        const adaptedResponse = adaptReviewsResponse(response);
        return calculateReviewStats(adaptedResponse.reviews);
      } catch {
        // На всякий случай (например, если backend снова отдаст 404)
        return calculateReviewStats([]);
      }
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // Кэшируем на 5 минут
  });
}
