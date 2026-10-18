import type { CartItem } from '@/entities/cart';
import { apiClient } from '../client';

class CartService {
  private readonly endpoints = {
    getCart: '/api/cart/get',
    addToCart: '/api/cart/add',
    updateQuantity: '/api/cart/update-qty',
    removeFromCart: '/api/cart/delete-cart-item',
    emptyCart: '/api/cart/emptyCart',
  };

  async getCart(): Promise<{ items: CartItem[]; totalPrice: number; totalItems: number }> {
    console.log('CartService: Fetching cart from API...');
    const response = await apiClient.get<{
      data: CartItem[];
      error: boolean;
      success: boolean;
      message?: string;
    }>(this.endpoints.getCart);

    console.log('CartService: Raw API response:', response);

    // Обрабатываем ответ от бэкенда согласно структуре server/controllers/cart.controller.js
    // API возвращает success/error на верхнем уровне
    if (response.data?.success === false) {
      throw new Error(response.data?.message || 'Ошибка при получении корзины');
    }

    // API возвращает данные напрямую в поле data
    const items = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
        ? response.data
        : [];
    console.log('CartService: Extracted items:', items);
    const totalPrice = items.reduce((sum: number, item: CartItem) => sum + item.subTotal, 0);
    const totalItems = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

    console.log('CartService: Returning cart data:', {
      items: items.length,
      totalPrice,
      totalItems,
    });
    return { items, totalPrice, totalItems };
  }

  async addToCart(product: Omit<CartItem, '_id' | 'subTotal'>): Promise<{ item: CartItem }> {
    // Рассчитываем subTotal перед отправкой
    const subTotal = product.price * product.quantity;

    // Бэкенд ожидает productTitle, а не name
    const productTitle = (product as any).productTitle || product.name || '';

    const response = await apiClient.post<{
      data: CartItem;
      message: string;
      error: boolean;
      success: boolean;
    }>(this.endpoints.addToCart, {
      ...product,
      productTitle, // Бэкенд ожидает productTitle (обязательное поле)
      subTotal,
    });

    // Обрабатываем ответ от бэкенда согласно структуре server/controllers/cart.controller.js
    if (!response.data?.success || !response.data?.data) {
      throw new Error(response.data?.message || 'Ошибка при добавлении товара в корзину');
    }

    return { item: response.data.data };
  }

  async updateQuantity(
    itemId: string,
    quantity: number,
    subTotal: number,
    size?: string,
    weight?: string,
    ram?: string,
    color?: string,
  ): Promise<{ message: string }> {
    // Бэкенд ожидает _id в теле запроса, а не в URL
    const response = await apiClient.put<{
      message: string;
      success: boolean;
      error: boolean;
      data: any;
    }>(this.endpoints.updateQuantity, {
      _id: itemId, // Бэкенд ожидает _id в теле запроса
      qty: quantity,
      subTotal,
      size,
      weight,
      ram,
      color,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Ошибка при обновлении количества');
    }

    return { message: response.data.message };
  }

  async removeFromCart(itemId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{
      message: string;
      error: boolean;
      success: boolean;
      data: any;
    }>(`${this.endpoints.removeFromCart}/${itemId}`);

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Ошибка при удалении товара из корзины');
    }

    return { message: response.data.message };
  }

  async emptyCart(userId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{
      error: boolean;
      success: boolean;
      message?: string;
    }>(`${this.endpoints.emptyCart}/${userId}`);

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Ошибка при очистке корзины');
    }

    return { message: response.data.message || 'Корзина очищена' };
  }

  /**
   * Merge guest cart with server cart on login
   *
   * CRITICAL:
   * - Backend uses atomic transaction
   * - Validates stock limits
   * - Returns adjustedItems if quantities were capped
   *
   * @param guestItems - Array of guest cart items to merge
   * @returns Merged cart with optional adjustedItems array
   */
  async mergeCart(guestItems: CartItem[]): Promise<{
    items: CartItem[];
    adjustedItems?: Array<{
      productId: string;
      productTitle: string;
      requestedQuantity: number;
      actualQuantity: number;
      reason: string;
    }>;
  }> {
    console.log('📤 [CartService] Merging guest cart:', guestItems.length, 'items');

    const response = await apiClient.post<{
      data: CartItem[];
      adjustedItems?: Array<{
        productId: string;
        productTitle: string;
        requestedQuantity: number;
        actualQuantity: number;
        reason: string;
      }>;
      message: string;
      error: boolean;
      success: boolean;
    }>('/api/cart/merge', {
      guestItems,
    });

    // CRITICAL: Check both success flag and error flag
    // Backend may return { success: false, error: true } or { success: false, error: false }
    if (!response.data?.success || response.data?.error) {
      const errorMessage = response.data?.message || 'Ошибка при слиянии корзины';
      console.error('❌ [CartService] Merge failed:', {
        success: response.data?.success,
        error: response.data?.error,
        message: errorMessage,
        response: response.data,
      });
      throw new Error(errorMessage);
    }

    console.log('✅ [CartService] Cart merged:', response.data.data?.length || 0, 'total items');

    if (response.data.adjustedItems && response.data.adjustedItems.length > 0) {
      console.warn('⚠️ [CartService] Stock adjustments:', response.data.adjustedItems);
    }

    return {
      items: response.data.data || [],
      adjustedItems: response.data.adjustedItems,
    };
  }
}

export const cartService = new CartService();
