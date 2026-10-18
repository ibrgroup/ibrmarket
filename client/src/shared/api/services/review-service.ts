import type {
  CreateReplyData,
  CreateReviewData,
  GetReviewsParams,
  ReportReviewData,
  Review,
  UpdateReviewData,
} from '@/entities/review/model/types';
import { apiClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Сервис для работы с отзывами товаров
 */
class ReviewService {
  private readonly endpoints = {
    getReviews: '/api/user/getReviews',
    getAllReviews: '/api/user/getAllReviews',
    addReview: '/api/user/addReview',
    updateReview: '/api/user/review',
    deleteReview: '/api/user/review',
    likeReview: '/api/user/review',
    reportReview: '/api/user/review',
    replyToReview: '/api/user/review',
    getStats: '/api/user/review',
  } as const;

  /**
   * Получить отзывы товара с фильтрацией и пагинацией
   */
  async getReviews(params: GetReviewsParams): Promise<any> {
    const queryParams = new URLSearchParams();

    queryParams.append('productId', params.productId);

    if (params.page) {
      queryParams.append('page', params.page.toString());
    }

    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    if (params.rating !== undefined) {
      if (Array.isArray(params.rating)) {
        params.rating.forEach((r) => queryParams.append('rating[]', r.toString()));
      } else {
        queryParams.append('rating', params.rating.toString());
      }
    }

    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }

    const queryString = queryParams.toString();
    const endpoint = `${this.endpoints.getReviews}?${queryString}`;

    try {
      return await apiClient.get(endpoint);
    } catch (err) {
      // Backend currently returns 404 when there are no reviews.
      // For UI this is not an error; treat it as empty list.
      const message = err instanceof Error ? err.message : String(err);
      const isNoReviews =
        message.toLowerCase().includes('нет отзывов') ||
        message.toLowerCase().includes('not found') ||
        message.toLowerCase().includes('ресурс не найден');

      if (isNoReviews) {
        const page = params.page ?? 1;
        return {
          reviews: [],
          total: 0,
          page,
          totalPages: 1,
          success: true,
          error: false,
        };
      }

      throw err;
    }
  }

  /**
   * Получить один отзыв по ID
   */
  async getReview(id: string): Promise<any> {
    return apiClient.get(`${this.endpoints.updateReview}/${id}`);
  }

  /**
   * Создать новый отзыв
   */
  async createReview(data: CreateReviewData): Promise<ApiResponse<Review>> {
    // Backend ожидает поля: productId, userId, userName, rating, review, image
    // Backend теперь принимает rating как Number
    return apiClient.post<Review>(this.endpoints.addReview, data);
  }

  /**
   * Обновить отзыв
   * Backend endpoint: PUT /api/user/review/:id
   */
  async updateReview(id: string, data: UpdateReviewData): Promise<ApiResponse<Review>> {
    return apiClient.put<Review>(`${this.endpoints.updateReview}/${id}`, data);
  }

  /**
   * Удалить отзыв
   * Backend endpoint: DELETE /api/user/review/:id
   */
  async deleteReview(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoints.deleteReview}/${id}`);
  }

  /**
   * Поставить лайк отзыву
   * Backend endpoint: POST /api/user/review/:id/like
   */
  async likeReview(id: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`${this.endpoints.likeReview}/${id}/like`, {});
  }

  /**
   * Пожаловаться на отзыв
   * Backend endpoint: POST /api/user/review/:id/report
   */
  async reportReview(data: ReportReviewData): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`${this.endpoints.reportReview}/${data.reviewId}/report`, {
      reason: data.reason,
    });
  }

  /**
   * Ответить на отзыв (требует backend endpoint)
   */
  async replyToReview(data: CreateReplyData): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`${this.endpoints.replyToReview}/${data.reviewId}/reply`, {
      reply: data.reply,
    });
  }

  /**
   * Получить статистику отзывов товара
   * Backend endpoint: GET /api/user/review/:productId/stats
   */
  async getReviewStats(productId: string): Promise<any> {
    return apiClient.get(`${this.endpoints.getStats}/${productId}/stats`);
  }

  /**
   * Получить все отзывы (для администратора)
   */
  async getAllReviews(): Promise<any> {
    return apiClient.get(this.endpoints.getAllReviews);
  }
}

export const reviewService = new ReviewService();
