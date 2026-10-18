'use client';

import { useUserStore } from '@/entities/user';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Textarea } from '@/shared/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCreateReview, useUpdateReview } from '../lib';
import { reviewSchema, type ReviewFormData } from '../model/schema';
import type { ReviewFormProps } from '../model/types';
import { ReviewRating } from './ReviewRating';

/**
 * Форма для создания/редактирования отзыва
 */
export function ReviewForm({
  productId,
  mode = 'create',
  reviewId,
  initialData,
  onSuccess,
  onCancel,
  className,
}: ReviewFormProps) {
  const { user } = useUserStore();
  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: initialData?.rating || 0,
      review: initialData?.review || '',
      image: initialData?.image || '',
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    if (!user) {
      toast.error('Необходимо войти в систему');
      return;
    }

    if (mode === 'create') {
      await createMutation.mutateAsync({
        productId,
        rating: data.rating,
        review: data.review,
        image: data.image,
      });
    } else if (mode === 'edit' && reviewId) {
      await updateMutation.mutateAsync({
        reviewId,
        productId,
        data: {
          rating: data.rating,
          review: data.review,
          image: data.image,
        },
      });
    }

    form.reset();
    onSuccess?.();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg">
          {mode === 'create' ? 'Написать отзыв' : 'Редактировать отзыв'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {/* Оценка */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ваша оценка *</FormLabel>
                  <FormControl>
                    <ReviewRating
                      value={field.value}
                      onChange={field.onChange}
                      size="lg"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Текст отзыва */}
            <FormField
              control={form.control}
              name="review"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ваш отзыв *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Расскажите о своем опыте использования товара..."
                      className="min-h-[120px] resize-none"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Минимум 10 символов, максимум 2000 символов</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Кнопки */}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Сохранение...' : mode === 'create' ? 'Опубликовать' : 'Сохранить'}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
