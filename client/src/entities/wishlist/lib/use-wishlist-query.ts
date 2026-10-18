import { useQuery } from '@tanstack/react-query';
import { wishlistService } from '@/shared/api/services/wishlist-service';
import type { WishlistItem } from '../model/types';

/**
 * Хук для получения списка избранного с кэшированием через React Query
 * Используется для оптимизации загрузки данных в профиле
 */
export function useWishlistQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { items } = await wishlistService.getWishlist();

      // Маппим серверные данные в формат WishlistItem (productTitle -> name)
      const mappedItems: WishlistItem[] = items.map((item) => ({
        ...item,
        name: item.productTitle || item.name || '',
        productTitle: item.productTitle || item.name || '',
      }));

      return mappedItems;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
    gcTime: 10 * 60 * 1000, // 10 минут - время хранения в кэше
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    refetchOnMount: false, // Не обновлять при монтировании, если данные свежие
  });
}
