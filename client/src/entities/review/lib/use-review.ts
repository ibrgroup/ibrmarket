import { reviewService } from '@/shared/api/services/review-service';
import { useQuery } from '@tanstack/react-query';
import type { Review } from '../model/types';
import { adaptReview } from './adapters';

/**
 * Хук для получения одного отзыва по ID
 */
export function useReview(id: string) {
  return useQuery<Review>({
    queryKey: ['review', id],
    queryFn: async () => {
      const response = await reviewService.getReview(id);
      return adaptReview(response);
    },
    enabled: !!id,
  });
}
