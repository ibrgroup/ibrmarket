import { reviewService } from '@/shared/api/services/review-service';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { GetReviewsParams, ReviewsResponse } from '../model/types';
import { adaptReviewsResponse } from './adapters';

/**
 * Хук для получения списка отзывов с infinite scroll
 */
export function useReviews(params: GetReviewsParams) {
  return useInfiniteQuery<ReviewsResponse>({
    queryKey: ['reviews', params.productId, params.rating, params.sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await reviewService.getReviews({
        ...params,
        page: pageParam as number,
        limit: params.limit || 10,
      });
      return adaptReviewsResponse(response);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!params.productId,
  });
}
