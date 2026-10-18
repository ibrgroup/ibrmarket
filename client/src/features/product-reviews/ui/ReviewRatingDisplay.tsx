'use client';

import { cn } from '@/shared/lib/utils';
import { Progress } from '@/shared/ui/progress';
import { Star } from 'lucide-react';
import type { ReviewRatingDisplayProps } from '../model/types';

/**
 * Компонент для отображения рейтинга с разбивкой по количеству
 */
export function ReviewRatingDisplay({
  averageRating,
  totalReviews,
  ratingDistribution,
  onFilterByRating,
  className,
}: ReviewRatingDisplayProps) {
  const stars = [5, 4, 3, 2, 1];

  const getRatingPercentage = (rating: number): number => {
    if (totalReviews === 0) return 0;
    const count = ratingDistribution[rating as keyof typeof ratingDistribution] || 0;
    return (count / totalReviews) * 100;
  };

  const getRatingCount = (rating: number): number => {
    return ratingDistribution[rating as keyof typeof ratingDistribution] || 0;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Общий рейтинг */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          <div className="text-5xl font-bold text-gray-900 dark:text-zinc-100">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'h-4 w-4',
                  star <= Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-none text-gray-300 dark:text-zinc-600',
                )}
              />
            ))}
          </div>
          <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            {totalReviews} {totalReviews === 1 ? 'отзыв' : totalReviews < 5 ? 'отзыва' : 'отзывов'}
          </div>
        </div>

        {/* Разбивка по рейтингам */}
        <div className="flex-1 space-y-2">
          {stars.map((rating) => {
            const percentage = getRatingPercentage(rating);
            const count = getRatingCount(rating);

            return (
              <button
                key={rating}
                onClick={() => onFilterByRating?.(rating)}
                className={cn(
                  'w-full flex items-center gap-2 group',
                  onFilterByRating &&
                    'cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-md px-2 py-1 -mx-2 transition-colors',
                )}
                disabled={!onFilterByRating}
                type="button"
              >
                <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-zinc-300 min-w-[60px]">
                  <span>{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>

                <div className="flex-1">
                  <Progress value={percentage} className="h-2" />
                </div>

                <div className="text-sm text-gray-500 dark:text-zinc-400 min-w-[40px] text-right">
                  {count}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
