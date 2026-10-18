'use client';

import type { ReviewSortOption } from '@/entities/review';
import { useReviews } from '@/entities/review';
import { useUserStore } from '@/entities/user';
import { cn } from '@/shared/lib/utils';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { Textarea } from '@/shared/ui/textarea';
import { MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useDeleteReview, useLikeReview, useReportReview } from '../lib';
import { REPORT_REASONS, REVIEW_BACKEND_FEATURES, REVIEWS_PER_PAGE } from '../model/constants';
import type { ReviewListProps } from '../model/types';
import { ReviewFilters } from './ReviewFilters';
import { ReviewForm } from './ReviewForm';
import { ReviewItem } from './ReviewItem';

/**
 * Компонент списка отзывов с infinite scroll
 */
export function ReviewList({ productId, className }: ReviewListProps) {
  const { user } = useUserStore();
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<ReviewSortOption>('newest');
  const [showForm, setShowForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0] ?? 'Другое');
  const [reportDetails, setReportDetails] = useState<string>('');

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const deleteMutation = useDeleteReview();
  const likeMutation = useLikeReview();
  const reportMutation = useReportReview();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } =
    useReviews({
      productId,
      rating: selectedRatings.length > 0 ? selectedRatings : undefined,
      sortBy,
      limit: REVIEWS_PER_PAGE,
    });

  // Infinite scroll observer
  useEffect(() => {
    if (isLoading || isFetchingNextPage || !hasNextPage) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 },
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchNextPage, hasNextPage, isLoading, isFetchingNextPage]);

  const handleEdit = (reviewId: string) => {
    setEditingReviewId(reviewId);
    setShowForm(true);
  };

  const handleDelete = (reviewId: string) => {
    if (!REVIEW_BACKEND_FEATURES.canDelete) {
      return;
    }
    deleteMutation.mutate({
      reviewId,
      productId,
    });
  };

  const handleLike = (reviewId: string) => {
    if (!REVIEW_BACKEND_FEATURES.canLike) {
      return;
    }
    likeMutation.mutate({
      reviewId,
      productId,
    });
  };

  const handleReport = (reviewId: string) => {
    if (!REVIEW_BACKEND_FEATURES.canReport) {
      return;
    }
    setReportingReviewId(reviewId);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingReviewId(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingReviewId(null);
  };

  const allReviews = data?.pages.flatMap((page) => page.reviews) || [];

  const editingReview = editingReviewId
    ? allReviews.find((r) => r._id === editingReviewId)
    : undefined;

  // Проверка: уже оставляли отзыв
  const existingUserReview = user ? allReviews.find((r) => r.userId === user._id) : undefined;
  const hasUserReview = !!existingUserReview;

  // Вычисляем распределение рейтингов для фильтров
  const ratingDistribution = allReviews.reduce(
    (acc, review) => {
      const rating = Math.round(review.rating);
      if (rating >= 1 && rating <= 5) {
        acc[rating as keyof typeof acc] = (acc[rating as keyof typeof acc] || 0) + 1;
      }
      return acc;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  );

  const submitReport = async () => {
    if (!reportingReviewId) return;
    await reportMutation.mutateAsync({
      reviewId: reportingReviewId,
      reason: reportDetails ? `${reportReason}: ${reportDetails}` : reportReason,
    });
    setReportingReviewId(null);
    setReportDetails('');
    setReportReason(REPORT_REASONS[0] ?? 'Другое');
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Фильтры */}
      <ReviewFilters
        selectedRatings={selectedRatings}
        sortBy={sortBy}
        onRatingsChange={setSelectedRatings}
        onSortChange={setSortBy}
        ratingDistribution={ratingDistribution}
      />

      {/* Кнопка добавления отзыва */}
      {user && !showForm && (
        <div className="space-y-2">
          {hasUserReview && (
            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center">
              Вы уже оставляли отзыв об этом товаре
            </p>
          )}
          <Button
            onClick={() => {
              if (hasUserReview && existingUserReview) {
                // Если уже есть отзыв, открываем форму редактирования
                setEditingReviewId(existingUserReview._id);
              }
              setShowForm(true);
            }}
            variant="outline"
            className="w-full border-none shadow-none"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {hasUserReview ? 'Редактировать отзыв' : 'Написать отзыв'}
          </Button>
        </div>
      )}

      {/* Форма отзыва */}
      {showForm && (
        <ReviewForm
          productId={productId}
          mode={editingReviewId ? 'edit' : 'create'}
          reviewId={editingReviewId || undefined}
          initialData={
            editingReview
              ? {
                  rating: editingReview.rating,
                  review: editingReview.review,
                  image: editingReview.image ?? '',
                }
              : undefined
          }
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {/* Диалог жалобы */}
      <Dialog
        open={!!reportingReviewId}
        onOpenChange={(open) => !open && setReportingReviewId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пожаловаться на отзыв</DialogTitle>
            <DialogDescription>
              Выберите причину. Жалоба будет отправлена модераторам.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Причина</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Детали (необязательно)</Label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Опишите подробнее (например, что именно не так)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReportingReviewId(null)}
              disabled={reportMutation.isPending}
            >
              Отмена
            </Button>
            <Button onClick={submitReport} disabled={reportMutation.isPending}>
              {reportMutation.isPending ? 'Отправка...' : 'Отправить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Список отзывов */}
      <div className="space-y-3  ">
        {isLoading ? (
          // Скелетон загрузки
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </>
        ) : isError ? (
          // Ошибка загрузки
          <Alert variant="destructive">
            <AlertDescription>
              {(error as any)?.message || 'Не удалось загрузить отзывы'}
            </AlertDescription>
          </Alert>
        ) : allReviews.length === 0 ? (
          // Нет отзывов
          <div className="text-center py-3">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-zinc-600" />
            <p className="mt-4 text-lg font-medium text-gray-900 dark:text-zinc-100">
              Пока нет отзывов
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
              Будьте первым, кто оставит отзыв об этом товаре
            </p>
          </div>
        ) : (
          // Вариант со слайдером с навигационными стрелками
          <Swiper
            navigation={true} // включение стрелок
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {allReviews.map((review) => (
              <SwiperSlide key={review._id}>
                <ReviewItem
                  review={review}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onLike={handleLike}
                  onReport={handleReport}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </div>
  );
}
