/**
 * Типы для feature product-reviews
 */

// Состояние формы отзыва
export type ReviewFormMode = 'create' | 'edit';

// Пропсы для компонентов отзывов
export interface ReviewListProps {
  productId: string;
  className?: string;
}

export interface ReviewItemProps {
  review: import('@/entities/review').Review;
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  onLike?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  onReply?: (reviewId: string) => void;
  className?: string;
}

export interface ReviewFormProps {
  productId: string;
  mode?: ReviewFormMode;
  reviewId?: string;
  initialData?: Partial<import('./schema').ReviewFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export interface ReviewFiltersProps {
  selectedRatings: number[];
  sortBy: import('@/entities/review').ReviewSortOption;
  onRatingsChange: (ratings: number[]) => void;
  onSortChange: (sort: import('@/entities/review').ReviewSortOption) => void;
  ratingDistribution?: Record<number, number>;
  className?: string;
}

export interface ReviewRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export interface ReviewRatingDisplayProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  onFilterByRating?: (rating: number) => void;
  className?: string;
}
