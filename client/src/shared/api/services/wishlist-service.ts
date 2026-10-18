import { apiClient } from '../client';
import type { WishlistItem } from '@/entities/wishlist';
import { devLog } from '@/shared/lib/logger';

class WishlistService {
  private readonly endpoints = {
    getWishlist: '/api/wishlist/',
    addToWishlist: '/api/wishlist/add',
    removeFromWishlist: '/api/wishlist',
  };

  async getWishlist(): Promise<{ items: WishlistItem[] }> {
    const response = await apiClient.get<{
      data: WishlistItem[];
      error: boolean;
      success: boolean;
      message?: string;
    }>(this.endpoints.getWishlist);

    // Обрабатываем ответ от бэкенда согласно структуре server/controllers/wishlist.controller.js
    // API возвращает success/error на верхнем уровне, а не в data.success
    if (response.data?.success === false) {
      throw new Error(response.data?.message || 'Ошибка при получении избранного');
    }
    // Если success = true или не определен, считаем успешным

    // API возвращает данные напрямую в поле data
    const items = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
        ? response.data
        : [];
    return { items };
  }

  async addToWishlist(product: Omit<WishlistItem, '_id'>): Promise<{ item: WishlistItem }> {
    try {
      // Подготавливаем данные согласно требованиям бэкенда
      const productId = product.productId;
      if (!productId) {
        throw new Error('productId обязателен для добавления в избранное');
      }

      const productTitle = product.productTitle || product.name || '';
      if (!productTitle) {
        throw new Error('productTitle обязателен для добавления в избранное');
      }

      const image = product.image || '';
      const price = typeof product.price === 'number' ? product.price : 0;
      const oldPrice = typeof product.oldPrice === 'number' ? product.oldPrice : price;
      const brand = product.brand || '';
      const discount = typeof product.discount === 'number' ? product.discount : 0;
      const rating = typeof product.rating === 'number' ? product.rating : 0;

      const requestData = {
        productId,
        productTitle,
        price,
        image,
        brand,
        oldPrice,
        discount,
        rating,
      };

      devLog.log('WishlistService: Sending request to addToWishlist:', requestData);

      const response = await apiClient.post<{
        data?: WishlistItem;
        error: boolean;
        success: boolean;
        message?: string;
      }>(this.endpoints.addToWishlist, requestData);

      devLog.log('WishlistService: Response from server:', response);

      // Обрабатываем ответ от бэкенда согласно структуре server/controllers/wishlist.controller.js
      // response.data содержит данные ответа, а сам response может быть ApiResponse
      const responseData = response.data;

      // Проверяем разные варианты структуры ответа
      if (responseData && (responseData.success === false || responseData.error === true)) {
        const errorMessage =
          responseData.message ||
          (typeof responseData.error === 'string' ? responseData.error : undefined) ||
          'Ошибка при добавлении товара в избранное';
        console.error('WishlistService: Server returned error:', errorMessage);
        throw new Error(errorMessage);
      }

      // Если success не указан явно, но нет ошибки, считаем успешным
      // В контроллере wishlist возвращается только success: true/false, без данных
      // Возвращаем оригинальный продукт как добавленный элемент
      return { item: { ...product, _id: Date.now().toString() } as WishlistItem };
    } catch (error) {
      // Улучшенная обработка ошибок
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Неизвестная ошибка при добавлении в избранное');
    }
  }

  async removeFromWishlist(itemId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{
      error: boolean;
      success: boolean;
      message?: string;
    }>(`${this.endpoints.removeFromWishlist}/${itemId}`);

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Ошибка при удалении товара из избранного');
    }

    return { message: response.data.message || 'Товар удален из избранного' };
  }

  /**
   * Merge guest wishlist with server wishlist on login
   *
   * CRITICAL:
   * - Backend uses atomic transaction
   * - Union operation (no duplicates by productId)
   * - Server items take precedence for metadata
   *
   * @param guestItems - Array of guest wishlist items to merge
   * @returns Merged wishlist
   */
  async mergeWishlist(guestItems: WishlistItem[]): Promise<{ items: WishlistItem[] }> {
    console.log('📤 [WishlistService] Merging guest wishlist:', guestItems.length, 'items');

    const response = await apiClient.post<{
      data: WishlistItem[];
      message: string;
      error: boolean;
      success: boolean;
    }>('/api/wishlist/merge', {
      guestItems,
    });

    // CRITICAL: Check both success flag and error flag
    // Backend may return { success: false, error: true } or { success: false, error: false }
    if (!response.data?.success || response.data?.error) {
      const errorMessage = response.data?.message || 'Ошибка при слиянии избранного';
      console.error('❌ [WishlistService] Merge failed:', {
        success: response.data?.success,
        error: response.data?.error,
        message: errorMessage,
        response: response.data,
      });
      throw new Error(errorMessage);
    }

    console.log('✅ [WishlistService] Wishlist merged:', response.data.data?.length || 0, 'total items');

    return { items: response.data.data || [] };
  }
}

export const wishlistService = new WishlistService();
