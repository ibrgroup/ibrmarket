import type { Review, ReviewStats, ReviewsResponse } from '../model/types';

/**
 * Адаптеры для преобразования данных отзывов из API в типизированные объекты
 */

/**
 * Преобразует сырой отзыв из API в типизированный Review
 */
export function adaptReview(rawReview: unknown): Review {
  const r = (rawReview ?? {}) as Record<string, unknown>;
  return {
    _id: (r._id as string) || (r.id as string) || '',
    productId: (r.productId as string) || '',
    userId: (r.userId as string) || '',
    userName: (r.userName as string) || 'Аноним',
    userAvatar: (r.userAvatar as string) || (r.image as string) || undefined,
    rating:
      typeof r.rating === 'string'
        ? Number.parseFloat(r.rating)
        : typeof r.rating === 'number'
          ? r.rating
          : 0,
    review: (r.review as string) || '',
    image: (r.image as string) || undefined,
    createdAt: (r.createdAt as string) || new Date().toISOString(),
    updatedAt: (r.updatedAt as string) || undefined,
    helpfulCount: typeof r.helpfulCount === 'number' ? r.helpfulCount : 0,
    replies: Array.isArray(r.replies) ? (r.replies as any[]) : [],
    isModerated: typeof r.isModerated === 'boolean' ? r.isModerated : false,
    moderatedBy: (r.moderatedBy as string) || undefined,
    reported: typeof r.reported === 'boolean' ? r.reported : false,
  };
}

/**
 * Преобразует массив сырых отзывов из API
 */
export function adaptReviews(rawReviews: unknown): Review[] {
  if (!Array.isArray(rawReviews)) {
    return [];
  }
  return rawReviews.map(adaptReview);
}

/**
 * Преобразует ответ API со списком отзывов
 */
export function adaptReviewsResponse(response: unknown): ReviewsResponse {
  // Обработка различных форматов ответа от backend
  let reviews: unknown[] = [];
  let total = 0;
  let page = 1;
  let totalPages = 1;

  const res = response as any;

  if (res && typeof res === 'object') {
    // Формат: { reviews: [...], total, page, totalPages }
    if (res.reviews && Array.isArray(res.reviews)) {
      reviews = res.reviews;
      total = res.total || res.reviews.length;
      page = res.page || 1;
      totalPages = res.totalPages || 1;
    }
    // Формат: { data: { reviews: [...] } }
    else if (res.data && res.data.reviews && Array.isArray(res.data.reviews)) {
      reviews = res.data.reviews;
      total = res.data.total || res.data.reviews.length;
      page = res.data.page || 1;
      totalPages = res.data.totalPages || 1;
    }
    // Формат: просто массив отзывов
    else if (Array.isArray(res)) {
      reviews = res;
      total = res.length;
      page = 1;
      totalPages = 1;
    }
  }

  return {
    reviews: adaptReviews(reviews),
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Вычисляет статистику отзывов из массива отзывов
 */
export function calculateReviewStats(reviews: Review[]): ReviewStats {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    };
  }

  const ratingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let totalRating = 0;

  reviews.forEach((review) => {
    const rating = Math.round(review.rating);
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating as keyof typeof ratingDistribution]++;
      totalRating += review.rating;
    }
  });

  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  return {
    averageRating,
    totalReviews: reviews.length,
    ratingDistribution,
  };
}

/**
 * Преобразует статистику отзывов из API
 */
export function adaptReviewStats(response: unknown, reviews?: Review[]): ReviewStats {
  // Если есть готовая статистика в ответе
  const res = response as any;
  if (res && res.stats) {
    return {
      averageRating: res.stats.averageRating || 0,
      totalReviews: res.stats.totalReviews || 0,
      ratingDistribution: res.stats.ratingDistribution || {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    };
  }

  // Иначе вычисляем из массива отзывов
  if (reviews) {
    return calculateReviewStats(reviews);
  }

  // Если нет данных, возвращаем пустую статистику
  return {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  };
}
