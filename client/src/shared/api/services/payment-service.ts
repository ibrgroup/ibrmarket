import { apiClient } from '../client';
import type { ApiResponse } from '../types';

// Типы для платежных данных
export interface PaymentMethod {
  id: string;
  type: 'card' | 'sbp' | 'paypal' | 'apple_pay' | 'google_pay';
  // YooKassa payment_method_id для повторных платежей
  paymentMethodId: string;
  // Отображаемая информация
  lastFour: string;
  brand: string; // visa, mastercard, mir
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  isVerified?: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  time: string;
  description: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  orderId: string;
}

export interface AddPaymentMethodRequest {
  type: 'card';
  number: string;
  expiryMonth: number;
  expiryYear: number;
  cvc: string;
  name: string;
  isDefault?: boolean;
}

export interface PaymentSecuritySettings {
  twoFactorEnabled: boolean;
  notifications: {
    newLogins: boolean;
    paymentMethodChanges: boolean;
    suspiciousActivity: boolean;
  };
}

class PaymentService {
  private readonly endpoints = {
    getPaymentMethods: '/api/payment/methods',
    addPaymentMethod: '/api/payment/methods',
    deletePaymentMethod: (id: string) => `/api/payment/methods/${id}`,
    setDefaultPaymentMethod: (id: string) => `/api/payment/methods/${id}/default`,
    getTransactions: '/api/payment/transactions',
    getSecuritySettings: '/api/payment/security',
    updateSecuritySettings: '/api/payment/security',
  };

  /**
   * Получить список способов оплаты пользователя
   */
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    const response = await apiClient.get<PaymentMethod[]>(this.endpoints.getPaymentMethods);
    return response;
  }

  /**
   * Добавить новый способ оплаты
   */
  async addPaymentMethod(data: AddPaymentMethodRequest): Promise<ApiResponse<PaymentMethod>> {
    const response = await apiClient.post<PaymentMethod>(this.endpoints.addPaymentMethod, data);
    return response;
  }

  /**
   * Удалить способ оплаты
   */
  async deletePaymentMethod(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(this.endpoints.deletePaymentMethod(id));
    return response;
  }

  /**
   * Установить способ оплаты по умолчанию
   */
  async setDefaultPaymentMethod(id: string): Promise<ApiResponse<PaymentMethod>> {
    const response = await apiClient.put<PaymentMethod>(
      this.endpoints.setDefaultPaymentMethod(id),
      {}
    );
    return response;
  }

  /**
   * Получить историю транзакций
   */
  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    const response = await apiClient.get<Transaction[]>(this.endpoints.getTransactions);
    return response;
  }

  /**
   * Получить настройки безопасности платежей
   */
  async getSecuritySettings(): Promise<ApiResponse<PaymentSecuritySettings>> {
    const response = await apiClient.get<PaymentSecuritySettings>(
      this.endpoints.getSecuritySettings
    );
    return response;
  }

  /**
   * Обновить настройки безопасности платежей
   */
  async updateSecuritySettings(
    settings: Partial<PaymentSecuritySettings>
  ): Promise<ApiResponse<PaymentSecuritySettings>> {
    const response = await apiClient.put<PaymentSecuritySettings>(
      this.endpoints.updateSecuritySettings,
      settings
    );
    return response;
  }
}

export const paymentService = new PaymentService();
