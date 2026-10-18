/**
 * Типы для сущности Review (отзыв о товаре)
 */

// Основная сущность отзыва
export interface Review {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  review: string;
  image?: string;
  createdAt: string;
  updatedAt?: string;

  // Расширенные поля (для будущего функционала)
  helpfulCount?: number;
  replies?: ReviewReply[];
  isModerated?: boolean;
  moderatedBy?: string;
  reported?: boolean;
}

// Ответ на отзыв
export interface ReviewReply {
  _id: string;
  reviewId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  reply: string;
  createdAt: string;
  updatedAt?: string;
}

// Фильтры для отзывов
export interface ReviewFilters {
  rating?: number | number[]; // Фильтр по рейтингу (одна или несколько оценок)
  sortBy?: ReviewSortOption;
  page?: number;
  limit?: number;
}

// Опции сортировки отзывов
export type ReviewSortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';

// Статистика отзывов товара
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// Данные для создания отзыва
export interface CreateReviewData {
  productId: string;
  rating: number;
  review: string;
  image?: string;
}

// Данные для обновления отзыва
export interface UpdateReviewData {
  rating?: number;
  review?: string;
  image?: string;
}

// Данные для ответа на отзыв
export interface CreateReplyData {
  reviewId: string;
  reply: string;
}

// Данные для жалобы на отзыв
export interface ReportReviewData {
  reviewId: string;
  reason: string;
}

// Параметры для получения отзывов с пагинацией
export interface GetReviewsParams {
  productId: string;
  page?: number;
  limit?: number;
  rating?: number | number[];
  sortBy?: ReviewSortOption;
}

// Ответ API со списком отзывов
export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}
