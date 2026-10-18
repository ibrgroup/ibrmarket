import { apiClient } from '../client';
import type { ApiResponse } from '../types';

/**
 * Типы для YooKassa API
 */

/**
 * Статус платежа в YooKassa
 */
export type YooKassaPaymentStatus =
  | 'pending'
  | 'waiting_for_capture'
  | 'succeeded'
  | 'canceled'
  | 'refunded';

/**
 * Способ оплаты в YooKassa
 */
export type YooKassaPaymentMethod =
  | 'bank_card'
  | 'sberbank'
  | 'yoo_money'
  | 'qiwi'
  | 'webmoney'
  | 'cash'
  | 'sbp';

/**
 * Тип карты
 */
export type CardType = 'MasterCard' | 'Visa' | 'Mir' | 'UnionPay' | 'Unknown';

/**
 * Сохраненный способ оплаты (карта)
 */
export interface SavedPaymentMethod {
  id: string;
  type: 'bank_card';
  saved: true;
  card: {
    first6: string;
    last4: string;
    expiry_year: string;
    expiry_month: string;
    card_type: CardType;
  };
  title?: string;
}

/**
 * Данные для создания платежа
 */
export interface CreatePaymentRequest {
  amount: {
    value: string; // Сумма в рублях (например, "100.00")
    currency: 'RUB';
  };
  description?: string;
  payment_method_data?: {
    type: YooKassaPaymentMethod;
  };
  payment_method_id?: string; // ID сохраненного способа оплаты
  save_payment_method?: boolean; // Сохранить способ оплаты для будущих платежей
  confirmation: {
    type: 'redirect' | 'qr_code' | 'embedded';
    return_url?: string; // Для redirect
  };
  capture?: boolean; // Автоматическое подтверждение платежа
  metadata?: {
    orderId?: string;
    userId?: string;
    [key: string]: string | undefined;
  };
  receipt?: {
    customer: {
      email?: string;
      phone?: string;
    };
    items: Array<{
      description: string;
      quantity: string;
      amount: {
        value: string;
        currency: 'RUB';
      };
      vat_code?: number;
    }>;
  };
}

/**
 * Ответ от YooKassa при создании платежа
 */
export interface YooKassaPaymentResponse {
  id: string;
  status: YooKassaPaymentStatus;
  amount: {
    value: string;
    currency: string;
  };
  description?: string;
  payment_method: {
    type: YooKassaPaymentMethod;
    id: string;
    saved: boolean;
    card?: {
      last4: string;
      exp_year: string;
      exp_month: string;
      card_type: string;
    };
  };
  confirmation: {
    type: 'redirect' | 'qr_code' | 'embedded';
    confirmation_url?: string; // URL для редиректа
    confirmation_token?: string; // Токен для embedded
    qr_code?: string; // QR код для СБП
  };
  created_at: string;
  expires_at?: string;
  metadata?: Record<string, string>;
  paid: boolean;
  refundable: boolean;
  test: boolean;
}

/**
 * Данные QR кода для СБП
 */
export interface SBPQRCodeData {
  qrCode: string;
  paymentId: string;
  amount: string;
  expiresAt?: string;
}

/**
 * Сервис для работы с YooKassa API
 */
class YooKassaService {
  private readonly endpoints = {
    createPayment: '/api/payment/yookassa/create',
    getPaymentStatus: (id: string) => `/api/payment/yookassa/status/${id}`,
  } as const;

  /**
   * Формирует объект receipt для YooKassa API
   * @warn КРИТИЧНО: Все значения amount.value и quantity должны быть строками с 2 знаками после запятой
   * @warn КРИТИЧНО: Сумма всех items должна совпадать с totalAmount (с учетом округления до 2 знаков)
   */
  private buildReceipt(params: {
    email?: string;
    phone?: string;
    items?: Array<{
      description: string;
      quantity: number;
      price: number;
    }>;
    description?: string;
    totalAmount: string; // Уже отформатированная сумма (например, "100.00")
  }): CreatePaymentRequest['receipt'] {
    if (!params.email && !params.phone && !params.items) {
      return undefined;
    }

    const receipt: CreatePaymentRequest['receipt'] = {
      customer: {},
      items: [],
    };

    if (params.email) {
      receipt.customer.email = params.email;
    }
    if (params.phone) {
      receipt.customer.phone = params.phone;
    }

    if (params.items && params.items.length > 0) {
      // Валидация items перед формированием receipt
      for (const item of params.items) {
        if (item.quantity <= 0) {
          throw new Error(`Количество товара "${item.description}" должно быть больше 0`);
        }
        if (item.price < 0) {
          throw new Error(`Цена товара "${item.description}" не может быть отрицательной`);
        }
      }

      receipt.items = params.items.map(item => ({
        description: item.description,
        quantity: item.quantity.toFixed(0), // Количество как строка без дробной части
        amount: {
          value: (item.price * item.quantity).toFixed(2), // Сумма с 2 знаками после запятой
          currency: 'RUB',
        },
        vat_code: 1, // НДС 20%
      }));

      // Валидация: сумма всех items должна совпадать с totalAmount (с учетом округления)
      const itemsSum = receipt.items.reduce((sum, item) => {
        return sum + parseFloat(item.amount.value);
      }, 0);
      const totalAmountNum = parseFloat(params.totalAmount);
      const difference = Math.abs(itemsSum - totalAmountNum);

      // Допускаем разницу до 0.01 рубля из-за округления
      if (difference > 0.01) {
        throw new Error(
          `Сумма товаров в чеке (${itemsSum.toFixed(2)}) не совпадает с суммой платежа (${params.totalAmount})`,
        );
      }
    } else {
      // Если нет товаров, добавляем общий товар
      receipt.items = [
        {
          description: params.description || 'Оплата заказа',
          quantity: '1',
          amount: {
            value: params.totalAmount,
            currency: 'RUB',
          },
          vat_code: 1,
        },
      ];
    }

    return receipt;
  }

  /**
   * Создать платеж через YooKassa
   */
  async createPayment(data: CreatePaymentRequest): Promise<ApiResponse<YooKassaPaymentResponse>> {
    // Логируем данные для отладки (только в dev режиме)
    if (process.env.NODE_ENV === 'development') {
      console.log('[YooKassaService] Creating payment with data:', {
        amount: data.amount,
        description: data.description,
        confirmation: data.confirmation.type,
      });
    }

    const response = await apiClient.post<YooKassaPaymentResponse>(
      this.endpoints.createPayment,
      data,
    );
    return response;
  }

  /**
   * Получить статус платежа
   */
  async getPaymentStatus(paymentId: string): Promise<ApiResponse<YooKassaPaymentResponse>> {
    const response = await apiClient.get<YooKassaPaymentResponse>(
      this.endpoints.getPaymentStatus(paymentId),
    );
    return response;
  }

  /**
   * Создать платеж банковской картой
   * @warn КРИТИЧНО: returnUrl должен быть передан с клиента, но валидируется на бэкенде
   * @warn КРИТИЧНО: saveCard флаг передается в YooKassa, но сохранение карты должно обрабатываться через webhook
   */
  async createCardPayment(params: {
    amount: number;
    description?: string;
    returnUrl?: string; // Опционально, бэкенд сформирует безопасный URL
    orderId?: string;
    userId?: string;
    email?: string;
    phone?: string;
    saveCard?: boolean; // Сохранить карту для будущих платежей (обрабатывается через webhook)
    items?: Array<{
      description: string;
      quantity: number;
      price: number;
    }>;
  }): Promise<ApiResponse<YooKassaPaymentResponse>> {
    const amountValue = params.amount.toFixed(2);

    // @warn returnUrl формируется на бэкенде для безопасности, но может быть передан клиентом для валидации
    const returnUrl = params.returnUrl || '/checkout/success';

    const paymentData: CreatePaymentRequest = {
      amount: {
        value: amountValue,
        currency: 'RUB',
      },
      description: params.description || `Оплата заказа #${params.orderId || 'unknown'}`,
      payment_method_data: {
        type: 'bank_card',
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      capture: true,
      // @warn КРИТИЧНО: save_payment_method работает только для bank_card
      // Для других способов оплаты этот параметр игнорируется
      save_payment_method: params.saveCard ? true : undefined, // Сохранить карту если указано (обрабатывается через webhook)
      metadata: {
        orderId: params.orderId,
        userId: params.userId,
        saveCard: params.saveCard ? 'true' : 'false', // Сохраняем флаг в metadata для webhook
      },
    };

    // Используем приватный метод для формирования receipt
    const receipt = this.buildReceipt({
      email: params.email,
      phone: params.phone,
      items: params.items,
      description: params.description,
      totalAmount: amountValue,
    });

    if (receipt) {
      paymentData.receipt = receipt;
    }

    return this.createPayment(paymentData);
  }

  /**
   * Создать платеж через СБП (QR код)
   * Для СБП YooKassa может вернуть либо qr_code в confirmation, либо confirmation_url для редиректа
   * @warn КРИТИЧНО: returnUrl должен быть передан с клиента, но валидируется на бэкенде
   * @warn КРИТИЧНО: С 3 октября 2024 для СБП можно передать return_url в confirmation
   */
  async createSBPPayment(params: {
    amount: number;
    description?: string;
    orderId?: string;
    userId?: string;
    email?: string;
    phone?: string;
    returnUrl?: string; // Опционально, бэкенд сформирует безопасный URL
    items?: Array<{
      description: string;
      quantity: number;
      price: number;
    }>;
  }): Promise<ApiResponse<YooKassaPaymentResponse>> {
    const amountValue = params.amount.toFixed(2);
    // @warn returnUrl формируется на бэкенде для безопасности, но может быть передан клиентом для валидации
    const returnUrl = params.returnUrl || '/checkout/success?payment=sbp';

    const paymentData: CreatePaymentRequest = {
      amount: {
        value: amountValue,
        currency: 'RUB',
      },
      description: params.description || `Оплата заказа #${params.orderId || 'unknown'}`,
      payment_method_data: {
        type: 'sbp',
      },
      // @warn Для СБП YooKassa может вернуть qr_code или confirmation_url
      // Используем redirect с return_url, YooKassa автоматически определит что вернуть
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      capture: true,
      metadata: {
        orderId: params.orderId,
        userId: params.userId,
      },
    };

    // Используем приватный метод для формирования receipt
    const receipt = this.buildReceipt({
      email: params.email,
      phone: params.phone,
      items: params.items,
      description: params.description,
      totalAmount: amountValue,
    });

    if (receipt) {
      paymentData.receipt = receipt;
    }

    return this.createPayment(paymentData);
  }

  /**
   * Создать платеж с использованием сохраненной карты
   * Для быстрой оплаты без редиректа
   * @warn КРИТИЧНО: returnUrl должен быть передан с клиента, но валидируется на бэкенде
   */
  async createPaymentWithSavedCard(params: {
    paymentMethodId: string;
    amount: number;
    description?: string;
    returnUrl?: string; // Опционально, бэкенд сформирует безопасный URL
    orderId?: string;
    userId?: string;
    email?: string;
    phone?: string;
    items?: Array<{
      description: string;
      quantity: number;
      price: number;
    }>;
  }): Promise<ApiResponse<YooKassaPaymentResponse>> {
    const amountValue = params.amount.toFixed(2);
    // @warn returnUrl формируется на бэкенде для безопасности, но может быть передан клиентом для валидации
    const returnUrl = params.returnUrl || '/checkout/success';

    const paymentData: CreatePaymentRequest = {
      amount: {
        value: amountValue,
        currency: 'RUB',
      },
      description: params.description || `Оплата заказа #${params.orderId || 'unknown'}`,
      payment_method_id: params.paymentMethodId, // Используем сохраненную карту
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      capture: true, // Автоматическое подтверждение
      metadata: {
        orderId: params.orderId,
        userId: params.userId,
      },
    };

    // Используем приватный метод для формирования receipt
    const receipt = this.buildReceipt({
      email: params.email,
      phone: params.phone,
      items: params.items,
      description: params.description,
      totalAmount: amountValue,
    });

    if (receipt) {
      paymentData.receipt = receipt;
    }

    return this.createPayment(paymentData);
  }
}

export const yooKassaService = new YooKassaService();
