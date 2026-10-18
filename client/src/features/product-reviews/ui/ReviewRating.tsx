'use client';

import { cn } from '@/shared/lib/utils';
import { Star } from 'lucide-react';
import { useState } from 'react';
import type { ReviewRatingProps } from '../model/types';

/**
 * Компонент для выбора рейтинга звездами (1-5)
 */
export function ReviewRating({
  value,
  onChange,
  size = 'md',
  disabled = false,
  className,
}: ReviewRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const stars = [1, 2, 3, 4, 5];

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!disabled) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverValue(null);
    }
  };

  const currentValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          disabled={disabled}
          className={cn(
            'cursor-pointer transition-all duration-150',
            disabled && 'cursor-not-allowed opacity-50',
            !disabled && 'hover:scale-110',
          )}
          aria-label={`Оценить на ${star} ${star === 1 ? 'звезду' : star < 5 ? 'звезды' : 'звезд'}`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              'transition-colors duration-150',
              star <= currentValue
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-gray-300 dark:text-zinc-600',
            )}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-zinc-300">{value}.0</span>
      )}
    </div>
  );
}
