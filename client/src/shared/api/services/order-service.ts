import { apiClient } from '../client';
import { devLog } from '@/shared/lib/logger';
import type {
  Order,
  CreateOrderRequest,
  CreateOrderResponse,
  InitPaymentRequest,
  InitPaymentResponse,
  PayWithSavedRequest,
} from '@/entities/order/model/types';

// Re-export types for convenience
export type { Order, CreateOrderRequest, CreateOrderResponse } from '@/entities/order/model/types';

/**
 * Типы для ответов API заказов
 */
interface OrdersResponse {
  data?: Order[] | { orders?: Order[] };
  orders?: Order[];
  success?: boolean;
  error?: boolean;
  message?: string;
  total?: number;
  page?: number;
  totalPages?: number;
}

interface OrderResponse {
  data?: Order;
  order?: Order;
  success?: boolean;
  error?: boolean;
  message?: string;
}

/**
 * Сервис для работы с заказами
 *
 * API контракт (backend):
 * - POST /api/order/create — создать заказ (товары из корзины, корзина очищается)
 * - POST /api/order/payment/yookassa/init — инициализация оплаты
 * - GET /api/order/order-list — список заказов (для админа)
 * - GET /api/order/order-list/orders — заказы пользователя
 * - GET /api/order/:id — детали заказа
 */
class OrderService {
  private readonly endpoints = {
    create: '/api/order/create',
    initPayment: '/api/order/payment/yookassa/init',
    payWithSaved: '/api/order/payment/yookassa/pay-with-saved',
    getOrders: '/api/order/order-list',
    getOrdersUser: '/api/order/order-list/orders',
    getOrder: '/api/order',
  } as const;

  /**
   * Извлекает массив заказов из ответа API
   */
  private extractOrders(response: unknown): Order[] {
    if (!response || typeof response !== 'object') {
      return [];
    }

    const resp = response as OrdersResponse;

    if (Array.isArray(resp)) {
      return resp;
    }

    if (Array.isArray(resp.data)) {
      return resp.data;
    }

    if (Array.isArray(resp.orders)) {
      return resp.orders;
    }

    if (
      resp.data &&
      typeof resp.data === 'object' &&
      'orders' in resp.data &&
      Array.isArray(resp.data.orders)
    ) {
      return resp.data.orders;
    }

    return [];
  }

  /**
   * Извлекает заказ из ответа API
   */
  private extractOrder(response: unknown): Order | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const resp = response as OrderResponse;

    if (resp.data && typeof resp.data === 'object' && '_id' in resp.data) {
      return resp.data as Order;
    }

    if (resp.order && typeof resp.order === 'object' && '_id' in resp.order) {
      return resp.order as Order;
    }

    if ('_id' in resp) {
      return resp as unknown as Order;
    }

    return null;
  }

  /**
   * Получить список заказов пользователя
   */
  async getOrders(page = 1, limit = 20): Promise<{ orders: Order[]; total: number; totalPages: number }> {
    try {
      const response = await apiClient.get<OrdersResponse>(
        `${this.endpoints.getOrdersUser}?page=${page}&limit=${limit}`
      );
      const data = response.data ?? response;
      const orders = this.extractOrders(data);

      return {
        orders,
        total: (data as OrdersResponse).total ?? orders.length,
        totalPages: (data as OrdersResponse).totalPages ?? 1,
      };
    } catch (error) {
      devLog.error('[OrderService] Error fetching orders:', error);
      return { orders: [], total: 0, totalPages: 1 };
    }
  }

  /**
   * Получить конкретный заказ по ID
   */
  async getOrder(id: string): Promise<Order> {
    const response = await apiClient.get<OrderResponse>(`${this.endpoints.getOrder}/${id}`);
    const order = this.extractOrder(response.data ?? response);

    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }

    return order;
  }

  /**
   * Создать новый заказ
   *
   * ❗ ВАЖНО:
   * - Товары берутся автоматически из корзины пользователя
   * - Корзина очищается сразу после создания заказа
   * - Остатки товаров резервируются (уменьшаются) на бэкенде
   * - Статус заказа: WAITING_PAYMENT
   *
   * @param data - только delivery_address (ID адреса)
   * @throws Error если не хватает остатков товара
   */
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await apiClient.post<CreateOrderResponse>(this.endpoints.create, data);
    const resp = (response.data ?? response) as CreateOrderResponse;

    if (resp.error || !resp.success) {
      throw new Error(resp.message || 'Не удалось создать заказ');
    }

    const order = this.extractOrder(resp);
    if (!order) {
      throw new Error('Не удалось создать заказ');
    }

    return order;
  }

  /**
   * Инициализация платежа через YooKassa
   *
   * ❗ ВАЖНО:
   * - Вызывать ПОСЛЕ создания заказа
   * - Возвращает confirmation_url для редиректа
   * - Фронт НЕ ждёт оплаты, просто редиректит пользователя
   *
   * @param data - orderId и опционально return_url
   * @returns confirmation_url для редиректа на страницу оплаты
   */
  async initPayment(data: InitPaymentRequest): Promise<InitPaymentResponse> {
    const response = await apiClient.post<InitPaymentResponse>(this.endpoints.initPayment, data);
    const resp = (response.data ?? response) as InitPaymentResponse;

    if (resp.error || !resp.success) {
      throw new Error('Не удалось инициализировать платёж');
    }

    if (resp.paid) {
      return resp;
    }

    if (!resp.confirmation_url) {
      throw new Error('Не получен URL для оплаты');
    }

    return resp;
  }

  /**
   * Оплата заказа ранее сохранённой картой ЮKassa (без ввода реквизитов на первом шаге).
   */
  async payWithSavedCard(data: PayWithSavedRequest): Promise<InitPaymentResponse> {
    const response = await apiClient.post<InitPaymentResponse>(this.endpoints.payWithSaved, data);
    const resp = (response.data ?? response) as InitPaymentResponse;

    if (resp.error || !resp.success) {
      throw new Error('Не удалось оплатить сохранённой картой');
    }

    if (resp.paid) {
      return resp;
    }

    if (resp.confirmation_url) {
      return resp;
    }

    throw new Error(resp.status ? `Статус платежа: ${resp.status}` : 'Неожиданный ответ оплаты');
  }

  /**
   * Синхронизировать статус оплаты заказа с ЮKassa.
   * Вызывать со страницы успеха, когда webhook мог не дойти (например localhost).
   * Если платёж в ЮKassa succeeded — бэкенд обновит заказ на PAID.
   */
  async syncPayment(orderId: string): Promise<{ order_status: string }> {
    const response = await apiClient.post<{ order_status: string; success?: boolean }>(
      `${this.endpoints.getOrder}/${orderId}/sync-payment`,
      {},
    );
    const data = (response.data ?? response) as { order_status: string };
    return { order_status: data?.order_status ?? 'WAITING_PAYMENT' };
  }
}

export const orderService = new OrderService();
