'use client';

import { orderService } from '@/shared/api/services/order-service';
import { useQuery } from '@tanstack/react-query';

/**
 * Хук для получения одного заказа по ID
 *
 * @example
 * const { data: order, isLoading, error } = useOrder(orderId);
 */
export function useOrder(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOrder(id!),
    enabled: enabled && !!id,
    staleTime: 30 * 1000, // 30 секунд — данные считаются свежими
    gcTime: 5 * 60 * 1000, // 5 минут — время хранения в кэше
    refetchOnWindowFocus: true, // Обновлять при фокусе (статус мог измениться)
    refetchOnMount: true, // Обновлять при монтировании
  });
}
