'use client';

import { useCartStore } from '@/entities/cart';
import { useCreateOrder, useInitPayment, type OrderDeliveryMethod } from '@/entities/order';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export type CheckoutStep = 'form' | 'creating_order' | 'order_created' | 'redirecting' | 'error';

interface CheckoutState {
  step: CheckoutStep;
  orderId: string | null;
  error: string | null;
}

/**
 * Хук для управления процессом оформления заказа
 *
 * Поток:
 * 1. Пользователь заполняет форму и выбирает адрес
 * 2. createOrder() — создаём заказ (товары из корзины, корзина очищается на бэкенде)
 * 3. Редирект на страницу заказа с кнопкой оплаты
 * 4. initPayment() — инициализируем оплату (на странице заказа)
 * 5. Редирект на YooKassa
 *
 * @example
 * const { createOrder, isCreatingOrder, checkoutState } = useCheckout();
 *
 * const handleSubmit = async (addressId: string) => {
 *   await createOrder(addressId, { delivery_method: 'pickup' });
 *   // Редирект на страницу заказа происходит автоматически
 * };
 */
export function useCheckout() {
  const router = useRouter();
  const { syncWithServer } = useCartStore();

  const [state, setState] = useState<CheckoutState>({
    step: 'form',
    orderId: null,
    error: null,
  });

  const {
    mutateAsync: createOrderMutation,
    isPending: isCreatingOrder,
    error: createOrderError,
  } = useCreateOrder();

  const {
    mutateAsync: initPaymentMutation,
    isPending: isInitPayment,
    error: initPaymentError,
  } = useInitPayment();

  /**
   * Создать заказ и перейти к оплате
   */
  const createOrder = useCallback(
    async (deliveryAddressId: string, options?: { delivery_method?: OrderDeliveryMethod }) => {
      try {
        setState({ step: 'creating_order', orderId: null, error: null });

        // 1. Создаём заказ
        const order = await createOrderMutation({
          delivery_address: deliveryAddressId,
          delivery_method: options?.delivery_method ?? 'courier',
        });

        setState({ step: 'order_created', orderId: order._id, error: null });

        // 2. Синхронизируем корзину (она очищена на бэкенде)
        await syncWithServer();

        // 3. Показываем сообщение
        toast.success('Заказ создан', {
          description: 'Перенаправляем на страницу оплаты...',
        });

        // 4. Редирект на страницу заказа
        router.push(`/checkout/order/${order._id}`);

        return order;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось создать заказ';

        setState({ step: 'error', orderId: null, error: message });

        toast.error('Ошибка', {
          description: message,
        });

        throw error;
      }
    },
    [createOrderMutation, syncWithServer, router],
  );

  /**
   * Инициализировать оплату для существующего заказа
   * (используется на странице заказа)
   */
  const initPayment = useCallback(
    async (orderId: string, returnUrl?: string) => {
      try {
        setState((prev) => ({ ...prev, step: 'redirecting' }));

        const response = await initPaymentMutation({
          orderId,
          return_url: returnUrl,
        });

        if (response.paid) {
          window.location.href =
            returnUrl || `${window.location.origin}/checkout/success?orderId=${orderId}`;
          return response;
        }
        if (response.confirmation_url) {
          window.location.href = response.confirmation_url;
          return response;
        }

        throw new Error('Не получен URL для оплаты');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Не удалось инициализировать оплату';

        setState((prev) => ({ ...prev, step: 'error', error: message }));

        toast.error('Ошибка оплаты', {
          description: message,
        });

        throw error;
      }
    },
    [initPaymentMutation],
  );

  /**
   * Сбросить состояние
   */
  const reset = useCallback(() => {
    setState({ step: 'form', orderId: null, error: null });
  }, []);

  return {
    // State
    checkoutState: state,
    isCreatingOrder,
    isInitPayment,
    isLoading: isCreatingOrder || isInitPayment,

    // Actions
    createOrder,
    initPayment,
    reset,

    // Errors
    createOrderError,
    initPaymentError,
  };
}
