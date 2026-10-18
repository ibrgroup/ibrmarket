import type { ReviewSortOption } from '@/entities/review';

/**
 * Константы для feature product-reviews
 */

// Лимит отзывов на странице
export const REVIEWS_PER_PAGE = 10;

/**
 * Флаги возможностей backend для отзывов.
 *
 * Backend теперь поддерживает все функции:
 * - POST /api/user/addReview
 * - GET /api/user/getReviews (с пагинацией, фильтрами, сортировкой)
 * - PUT /api/user/review/:id (updateReview)
 * - DELETE /api/user/review/:id (deleteReview)
 * - POST /api/user/review/:id/like (likeReview)
 * - POST /api/user/review/:id/report (reportReview)
 * - GET /api/user/review/:productId/stats (getReviewStats)
 *
 * Можно включить через env переменную или оставить true по умолчанию.
 */
export const REVIEW_BACKEND_FEATURES = {
  canEdit: process.env.NEXT_PUBLIC_REVIEWS_FULL_BACKEND !== 'false',
  canDelete: process.env.NEXT_PUBLIC_REVIEWS_FULL_BACKEND !== 'false',
  canLike: process.env.NEXT_PUBLIC_REVIEWS_FULL_BACKEND !== 'false',
  canReport: process.env.NEXT_PUBLIC_REVIEWS_FULL_BACKEND !== 'false',
} as const;

// Опции сортировки отзывов для review фичи
export const REVIEW_SORT_OPTIONS: Array<{ value: ReviewSortOption; label: string }> = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
  { value: 'highest', label: 'Высокая оценка' },
  { value: 'lowest', label: 'Низкая оценка' },
  { value: 'helpful', label: 'Самые полезные' },
];

// Опции рейтинга для фильтрации отзывов
export const REVIEW_RATING_OPTIONS = [
  { value: 5, label: '5 звезд', count: 0 },
  { value: 4, label: '4 звезды', count: 0 },
  { value: 3, label: '3 звезды', count: 0 },
  { value: 2, label: '2 звезды', count: 0 },
  { value: 1, label: '1 звезда', count: 0 },
];

// Причины для жалобы на отзыв
export const REPORT_REASONS = [
  'Спам или реклама',
  'Оскорбления или ненормативная лексика',
  'Не относится к товару',
  'Фейковый отзыв',
  'Другое',
];

// Минимальное количество символов в отзыве
export const MIN_REVIEW_LENGTH = 10;

// Максимальное количество символов в отзыве
export const MAX_REVIEW_LENGTH = 2000;
