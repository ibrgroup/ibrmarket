import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { paymentService } from '@/shared/api/services/payment-service';

import type { PaymentState, PaymentStore } from './types';

/**
 * Начальное состояние Payment Store
 */
const INITIAL_STATE: PaymentState = {
  paymentMethods: [],
  transactions: [],
  securitySettings: {
    twoFactorEnabled: false,
    notifications: {
      newLogins: true,
      paymentMethodChanges: true,
      suspiciousActivity: true,
    },
  },
  isLoading: false,
  error: null,
};

/**
 * Payment Store для управления платежами
 * - Способы оплаты
 * - История транзакций
 * - Настройки безопасности
 */
export const usePaymentStore = create<PaymentStore>()(
  persist(
    (set, get) => ({
      // State
      ...INITIAL_STATE,

      // Actions
      actions: {
        paymentMethods: {
          fetch: async () => {
            set({ isLoading: true, error: null });
            try {
              const response = await paymentService.getPaymentMethods();
              if (response.data !== undefined) {
                set({ paymentMethods: response.data || [], isLoading: false });
              } else {
                throw new Error(response.message || 'Ошибка при получении способов оплаты');
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
              set({ error: message, isLoading: false });
              console.error('PaymentStore: Failed to fetch payment methods:', error);
            }
          },

          add: async data => {
            set({ isLoading: true, error: null });
            try {
              const response = await paymentService.addPaymentMethod(data);
              if (response.data !== undefined) {
                set(state => ({
                  paymentMethods: [...state.paymentMethods, response.data!],
                  isLoading: false,
                }));
              } else {
                throw new Error(response.message || 'Ошибка при добавлении способа оплаты');
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
              set({ error: message, isLoading: false });
              console.error('PaymentStore: Failed to add payment method:', error);
            }
          },

          /**
           * Сохранить карту после успешного платежа YooKassa
           */
          saveCardFromPayment: async (paymentResponse: {
            payment_method: {
              id: string;
              type: string;
              saved: boolean;
              card?: {
                last4: string;
                expiry_year: string;
                expiry_month: string;
                card_type: string;
              };
            };
          }) => {
            set({ isLoading: true, error: null });
            try {
              const { payment_method } = paymentResponse;

              // Проверяем что это карта и она сохранена
              if (payment_method.type !== 'bank_card' || !payment_method.saved || !payment_method.card) {
                throw new Error('Карта не была сохранена YooKassa');
              }

              // Создаем объект PaymentMethod для локального хранения
              const newCard: any = {
                id: `card_${Date.now()}`, // Временный ID, должен прийти с backend
                type: 'card',
                paymentMethodId: payment_method.id,
                lastFour: payment_method.card.last4,
                brand: payment_method.card.card_type.toLowerCase(),
                expiryMonth: parseInt(payment_method.card.expiry_month),
                expiryYear: parseInt(payment_method.card.expiry_year),
                isDefault: get().paymentMethods.length === 0, // Первая карта - по умолчанию
                createdAt: new Date().toISOString(),
              };

              // Добавляем в список
              set(state => ({
                paymentMethods: [...state.paymentMethods, newCard],
                isLoading: false,
              }));

              console.log('PaymentStore: Card saved successfully:', newCard);
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Ошибка при сохранении карты';
              set({ error: message, isLoading: false });
              console.error('PaymentStore: Failed to save card from payment:', error);
            }
          },

          delete: async (id: string) => {
            set({ isLoading: true, error: null });
            try {
              const response = await paymentService.deletePaymentMethod(id);
              if (!response.error) {
                set(state => ({
                  paymentMethods: state.paymentMethods.filter(method => method.id !== id),
                  isLoading: false,
                }));
              } else {
                throw new Error(response.message || 'Ошибка при удалении способа оплаты');
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
              set({ error: message, isLoading: false });
              console.error('PaymentStore: Failed to delete payment method:', error);
            }
          },

          setDefault: async (id: string) => {
            set({ isLoading: true, error: null });
            try {
              const response = await paymentService.setDefaultPaymentMethod(id);
              if (response.data !== undefined) {
                set(state => ({
                  paymentMethods: state.paymentMethods.map(method => ({
                    ...method,
                    isDefault: method.id === id,
                  })),
                  isLoading: false,
                }));
              } else {
                throw new Error(
                  response.message || 'Ошибка при установке способа оплаты по умолчанию'
                );
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
              set({ error: message, isLoading: false });
              console.error('PaymentStore: Failed to set default payment method:', error);
            }
          },
        },
        transactions: {
          fetch: async () => {
            set({ isLoading: true, error: null });
            try {
              const response = await paymentService.getTransactions();
              if (response.data !== undefined) {
                set({ transactions: response.data || [], isLoading: false });
              } else {
                throw new Error(response.message || 'Ошибка при получении истории транзакций');
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
              set({ error: message, isLoading: false });
              console.error('PaymentStore: Failed to fetch transactions:', error);
            }
          },
        },
        security: {
          fetch: async () => {
            set({ isLoading: true, error: null });
            try {
              const response = await paymentService.getSecuritySettings();
              if (response.data !== undefined) {
                set({ securitySettings: response.data!, isLoading: false });
              } else {
                throw new Error(response.message || 'Ошибка при получении настроек безопасности');
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
              set({ error: message, isLoading: false });
              console.error('PaymentStore: Failed to fetch security settings:', error);
            }
          },
          update: async settings => {
            set({ isLoading: true, error: null });
            try {
              const response = await paymentService.updateSecuritySettings(settings);
              if (response.data !== undefined) {
                set({ securitySettings: response.data!, isLoading: false });
              } else {
                throw new Error(response.message || 'Ошибка при обновлении настроек безопасности');
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
              set({ error: message, isLoading: false });
              console.error('PaymentStore: Failed to update security settings:', error);
            }
          },
        },
        error: {
          clear: () => {
            set({ error: null });
          },
        },
      },
    }),
    {
      name: 'payment-storage',
      partialize: state => ({
        paymentMethods: state.paymentMethods,
        transactions: state.transactions,
        securitySettings: state.securitySettings,
      }),
    }
  )
);
