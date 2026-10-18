import { reviewService } from '@/shared/api/services/review-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface LikeReviewParams {
  reviewId: string;
  productId: string;
}

/**
 * Хук для лайка отзыва
 */
export function useLikeReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId }: LikeReviewParams) => {
      return reviewService.likeReview(reviewId);
    },
    onSuccess: (_, variables) => {
      // Инвалидируем кэш отзывов для обновления счетчика лайков
      queryClient.invalidateQueries({
        queryKey: ['reviews', variables.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ['review', variables.reviewId],
      });
      toast.success('Спасибо за оценку!');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || 'Не удалось поставить лайк';
      toast.error(message);
    },
  });
}
