'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/shared/api/services/order-service';
import type { CreateOrderRequest, Order } from '@/entities/order/model/types';

/**
 * Хук для создания заказа
 *
 * ❗ ВАЖНО:
 * - Товары берутся автоматически из корзины на бэкенде
 * - Корзина очищается после создания заказа
 * - Остатки резервируются (уменьшаются) на бэкенде
 * - Если не хватает остатков — бэкенд вернёт 400 с сообщением
 *
 * @example
 * const { mutate: createOrder, isPending } = useCreateOrder({
 *   onSuccess: (order) => {
 *     // Заказ создан, переходим к оплате
 *     router.push(`/checkout/pay/${order._id}`);
 *   },
 *   onError: (error) => {
 *     // Показать ошибку (например, нехватка товара)
 *     toast.error(error.message);
 *   },
 * });
 *
 * createOrder({ delivery_address: addressId });
 */
export function useCreateOrder(options?: {
  onSuccess?: (order: Order) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => orderService.createOrder(data),
    onSuccess: (order) => {
      // Инвалидируем кэш корзины (она очищена на бэкенде)
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // Инвалидируем кэш заказов
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      options?.onSuccess?.(order);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
