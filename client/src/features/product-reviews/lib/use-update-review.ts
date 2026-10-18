import type { UpdateReviewData } from '@/entities/review';
import { reviewService } from '@/shared/api/services/review-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UpdateReviewParams {
  reviewId: string;
  productId: string;
  data: UpdateReviewData;
}

/**
 * Хук для обновления отзыва
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, data }: UpdateReviewParams) => {
      return reviewService.updateReview(reviewId, data);
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
      toast.success('Отзыв обновлен успешно');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || 'Не удалось обновить отзыв';
      toast.error(message);
    },
  });
}
