/**
 * Unit-тесты для YooKassaService
 *
 * @warn Эти тесты используют mock для apiClient.
 * Для запуска: npm test yookassa-service.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { yooKassaService } from '../yookassa-service';
import { apiClient } from '../../client';
import type { YooKassaPaymentResponse } from '../yookassa-service';

// Мокаем apiClient
vi.mock('../../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('YooKassaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCardPayment', () => {
    it('корректно вызывает api с правильными параметрами', async () => {
      const mockResponse: YooKassaPaymentResponse = {
        id: 'payment_123',
        status: 'pending',
        amount: {
          value: '1000.00',
          currency: 'RUB',
        },
        payment_method: {
          type: 'bank_card',
          id: 'pm_123',
          saved: false,
        },
        confirmation: {
          type: 'redirect',
          confirmation_url: 'https://yookassa.ru/checkout/payments/payment_123',
        },
        created_at: '2024-01-01T00:00:00.000Z',
        paid: false,
        refundable: false,
        test: true,
      };

      // Исправлено: убран неизвестный ключ 'status'
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockResponse,
      });

      const params = {
        amount: 1000,
        description: 'Тестовый платеж',
        returnUrl: '/checkout/success',
        email: 'test@example.com',
        phone: '+79991234567',
        saveCard: true,
        items: [
          {
            description: 'Товар 1',
            quantity: 2,
            price: 500,
          },
        ],
      };

      const result = await yooKassaService.createCardPayment(params);

      expect(result.data).toEqual(mockResponse);

      // Проверяем вызов apiClient.post с нужными параметрами
      expect(apiClient.post).toHaveBeenCalledTimes(1);

      const [endpoint, bodyUnknown] = vi.mocked(apiClient.post).mock.calls[0];
      // Явно приводим тип для body, чтобы TS не ругался на unknown
      const body = bodyUnknown as Record<string, any>;

      expect(endpoint).toBe('/api/payment/yookassa/create');

      // Проверка основных полей запроса
      expect(body).toEqual(
        expect.objectContaining({
          amount: {
            value: '1000.00',
            currency: 'RUB',
          },
          description: params.description,
          payment_method_data: { type: 'bank_card' },
          confirmation: {
            type: 'redirect',
            return_url: params.returnUrl,
          },
          capture: true,
          save_payment_method: true,
          metadata: expect.objectContaining({ saveCard: 'true' }),
          receipt: expect.objectContaining({
            customer: {
              email: 'test@example.com',
              phone: '+79991234567',
            },
          }),
        })
      );

      // Проверка receipt.items
      expect(body.receipt.items).toBeDefined();
      expect(Array.isArray(body.receipt.items)).toBe(true);
      const [firstItem] = body.receipt.items;
      expect(firstItem).toMatchObject({
        description: 'Товар 1',
        quantity: '2',
        amount: {
          value: '1000.00',
          currency: 'RUB',
        },
        vat_code: 1,
      });
      expect(typeof firstItem.quantity).toBe('string');
      expect(typeof firstItem.amount.value).toBe('string');
    });

    it('форматирует receipt items: quantity и amount.value обязательно строки', async () => {
      const mockResponse: YooKassaPaymentResponse = {
        id: 'payment_123',
        status: 'pending',
        amount: {
          value: '1500.00',
          currency: 'RUB',
        },
        payment_method: {
          type: 'bank_card',
          id: 'pm_123',
          saved: false,
        },
        confirmation: {
          type: 'redirect',
          confirmation_url: 'https://yookassa.ru/checkout/payments/payment_123',
        },
        created_at: '2024-01-01T00:00:00.000Z',
        paid: false,
        refundable: false,
        test: true,
      };

      // Исправлено: убран неизвестный ключ 'status'
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockResponse,
      });

      await yooKassaService.createCardPayment({
        amount: 1500,
        items: [
          {
            description: 'Товар 1',
            quantity: 3,
            price: 500,
          },
        ],
      });

      const [, bodyUnknown] = vi.mocked(apiClient.post).mock.calls[0];
      const body = bodyUnknown as Record<string, any>;
      const items = body.receipt?.items;
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(1);

      const item = items[0];
      expect(item.quantity).toBe('3');
      expect(item.amount.value).toBe('1500.00');
      expect(typeof item.quantity).toBe('string');
      expect(typeof item.amount.value).toBe('string');
    });

    it('создаёт receipt с общим товаром, если items не указаны', async () => {
      const mockResponse: YooKassaPaymentResponse = {
        id: 'payment_123',
        status: 'pending',
        amount: {
          value: '1000.00',
          currency: 'RUB',
        },
        payment_method: {
          type: 'bank_card',
          id: 'pm_123',
          saved: false,
        },
        confirmation: {
          type: 'redirect',
          confirmation_url: 'https://yookassa.ru/checkout/payments/payment_123',
        },
        created_at: '2024-01-01T00:00:00.000Z',
        paid: false,
        refundable: false,
        test: true,
      };

      // Исправлено: убран неизвестный ключ 'status'
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockResponse,
      });

      await yooKassaService.createCardPayment({
        amount: 1000,
        description: 'Оплата заказа',
        email: 'test@example.com',
      });

      const [, bodyUnknown] = vi.mocked(apiClient.post).mock.calls[0];
      const body = bodyUnknown as Record<string, any>;
      const receiptItems = body.receipt?.items;
      expect(Array.isArray(receiptItems)).toBe(true);
      expect(receiptItems.length).toBe(1);

      const firstItem = receiptItems[0];

      expect(firstItem.description).toBe('Оплата заказа');
      expect(firstItem.quantity).toBe('1');
      expect(firstItem.amount.value).toBe('1000.00');
      expect(firstItem.amount.currency).toBe('RUB');
      expect(typeof firstItem.quantity).toBe('string');
      expect(typeof firstItem.amount.value).toBe('string');
    });

    it('корректно передаёт минимальные параметры', async () => {
      const mockResponse: YooKassaPaymentResponse = {
        id: 'payment_456',
        status: 'pending',
        amount: {
          value: '200.00',
          currency: 'RUB',
        },
        payment_method: {
          type: 'bank_card',
          id: 'pm_456',
          saved: false,
        },
        confirmation: {
          type: 'redirect',
          confirmation_url: 'https://yookassa.ru/checkout/payments/payment_456',
        },
        created_at: '2024-02-02T00:00:00.000Z',
        paid: false,
        refundable: false,
        test: false,
      };

      // Исправлено: убран неизвестный ключ 'status'
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockResponse,
      });

      await yooKassaService.createCardPayment({
        amount: 200,
      });

      const [, bodyUnknown] = vi.mocked(apiClient.post).mock.calls[0];
      const body = bodyUnknown as Record<string, any>;
      // Проверяем, что amount находится в теле и соответствует нужному формату
      expect(body.amount).toEqual({
        value: '200.00',
        currency: 'RUB',
      });
      // Проверяем, что receipt создан даже без остальных необязательных параметров
      expect(body.receipt).toBeDefined();
      expect(body.receipt.items?.[0]?.quantity).toBe('1');
      expect(body.receipt.items?.[0]?.amount.value).toBe('200.00');
    });
  });
});
