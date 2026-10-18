import { reviewService } from '@/shared/api/services/review-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DeleteReviewParams {
  reviewId: string;
  productId: string;
}

/**
 * Хук для удаления отзыва
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId }: DeleteReviewParams) => {
      return reviewService.deleteReview(reviewId);
    },
    onSuccess: (_, variables) => {
      // Инвалидируем кэш отзывов для данного товара
      queryClient.invalidateQueries({
        queryKey: ['reviews', variables.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ['review-stats', variables.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ['review', variables.reviewId],
      });
      toast.success('Отзыв удален успешно');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || 'Не удалось удалить отзыв';
      toast.error(message);
    },
  });
}
