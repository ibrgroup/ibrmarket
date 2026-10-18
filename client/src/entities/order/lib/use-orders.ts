'use client';

import { orderService } from '@/shared/api/services/order-service';
import { useQuery } from '@tanstack/react-query';
import type { Order } from '../model/types';

/**
 * Хук для получения списка заказов пользователя
 * Использует React Query для кэширования и оптимизации запросов
 */
export function useOrders(enabled: boolean = true) {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      /** Бэкенд: limit ≤ 100; подгружаем все страницы, иначе «Мои покупки» и заказы обрезались бы 20 записями. */
      const limit = 100;
      let page = 1;
      let totalPages = 1;
      const all: Order[] = [];
      do {
        const { orders, totalPages: tp } = await orderService.getOrders(page, limit);
        all.push(...orders);
        totalPages = tp;
        page += 1;
      } while (page <= totalPages);
      return all;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
    gcTime: 10 * 60 * 1000, // 10 минут - время хранения в кэше
    refetchOnWindowFocus: true, // Обновлять при фокусе окна (статусы могут измениться)
    refetchOnMount: true, // Обновлять при монтировании
  });
}
