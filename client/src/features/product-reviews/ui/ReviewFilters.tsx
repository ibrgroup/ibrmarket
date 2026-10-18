'use client';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Star } from 'lucide-react';
import { REVIEW_SORT_OPTIONS } from '../model/constants';
import type { ReviewFiltersProps } from '../model/types';

/**
 * Компонент для фильтрации и сортировки отзывов
 */
export function ReviewFilters({
  selectedRatings,
  sortBy,
  onRatingsChange,
  onSortChange,
  ratingDistribution,
  className,
}: ReviewFiltersProps) {
  const ratings = [5, 4, 3, 2, 1];

  const toggleRating = (rating: number) => {
    if (selectedRatings.includes(rating)) {
      onRatingsChange(selectedRatings.filter((r) => r !== rating));
    } else {
      onRatingsChange([...selectedRatings, rating]);
    }
  };

  const getRatingCount = (rating: number): number => {
    if (!ratingDistribution) return 0;
    return ratingDistribution[rating as keyof typeof ratingDistribution] || 0;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Сортировка */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Сортировка:</span>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px] h-[35px] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REVIEW_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Фильтр по рейтингу */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
          Фильтр по оценке:
        </span>
        <div className="flex flex-wrap gap-2 border-none">
          {ratings.map((rating) => {
            const count = getRatingCount(rating);
            const isSelected = selectedRatings.includes(rating);

            return (
              <button
                key={rating}
                onClick={() => toggleRating(rating)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all',
                  isSelected
                    ? 'border-primary bg-primary text-white dark:border-primary dark:bg-primary'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800',
                )}
                type="button"
              >
                <Star
                  className={cn(
                    'h-4 w-4',
                    isSelected ? 'fill-white text-white' : 'fill-yellow-400 text-yellow-400',
                  )}
                />
                <span>{rating}</span>
                {count > 0 && (
                  <Badge
                    variant={isSelected ? 'secondary' : 'outline'}
                    className={cn(
                      'ml-1 text-xs',
                      isSelected && 'bg-white/20 text-white border-white/30',
                    )}
                  >
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Кнопка сброса */}
        {selectedRatings.length > 0 && (
          <button
            onClick={() => onRatingsChange([])}
            className="text-sm text-primary hover:underline"
            type="button"
          >
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  );
}
