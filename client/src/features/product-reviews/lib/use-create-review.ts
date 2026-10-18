import type { CreateReviewData } from '@/entities/review';
import { useUserStore } from '@/entities/user';
import { reviewService } from '@/shared/api/services/review-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Хук для создания отзыва
 */
export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  return useMutation({
    mutationFn: async (data: CreateReviewData) => {
      // Добавляем данные пользователя
      const reviewData = {
        ...data,
        userId: user?._id || '',
        userName: user?.name || 'Аноним',
      };
      return reviewService.createReview(reviewData);
    },
    onSuccess: (_, variables) => {
      // Инвалидируем кэш отзывов для данного товара
      queryClient.invalidateQueries({
        queryKey: ['reviews', variables.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ['review-stats', variables.productId],
      });
      // Инвалидируем кэш продукта, чтобы обновился рейтинг
      queryClient.invalidateQueries({
        queryKey: ['product', variables.productId],
      });
      toast.success('Отзыв добавлен успешно');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || 'Не удалось добавить отзыв';
      toast.error(message);
    },
  });
}
