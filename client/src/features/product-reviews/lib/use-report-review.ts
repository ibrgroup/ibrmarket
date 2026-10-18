import type { ReportReviewData } from '@/entities/review';
import { reviewService } from '@/shared/api/services/review-service';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Хук для жалобы на отзыв
 */
export function useReportReview() {
  return useMutation({
    mutationFn: async (data: ReportReviewData) => {
      return reviewService.reportReview(data);
    },
    onSuccess: () => {
      toast.success('Жалоба отправлена. Спасибо за обратную связь!');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || 'Не удалось отправить жалобу';
      toast.error(message);
    },
  });
}
