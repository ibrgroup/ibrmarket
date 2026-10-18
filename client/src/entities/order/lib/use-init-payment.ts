'use client';

import type {
  InitPaymentRequest,
  InitPaymentResponse,
  PayWithSavedRequest,
} from '@/entities/order/model/types';
import { orderService } from '@/shared/api/services/order-service';
import { useMutation } from '@tanstack/react-query';

/**
 * Хук для инициализации платежа через YooKassa
 *
 * ❗ ВАЖНО:
 * - Вызывать ПОСЛЕ создания заказа
 * - После успеха — редирект на confirmation_url
 * - Фронт НЕ ждёт оплаты, просто редиректит пользователя
 * - Webhook на бэкенде обработает статус оплаты
 *
 * @example
 * const { mutate: initPayment, isPending } = useInitPayment({
 *   onSuccess: (data) => {
 *     // Редирект на страницу оплаты YooKassa
 *     window.location.href = data.confirmation_url;
 *   },
 *   onError: (error) => {
 *     toast.error('Не удалось инициализировать оплату');
 *   },
 * });
 *
 * initPayment({ orderId: order._id });
 */
export function useInitPayment(options?: {
  onSuccess?: (data: InitPaymentResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (data: InitPaymentRequest) => orderService.initPayment(data),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

/** Оплата сохранённой картой ЮKassa */
export function usePayWithSavedCard(options?: {
  onSuccess?: (data: InitPaymentResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (data: PayWithSavedRequest) => orderService.payWithSavedCard(data),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
