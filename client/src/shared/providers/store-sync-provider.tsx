'use client';

import { useCartStore } from '@/entities/cart';
import { useWishlistStore } from '@/entities/wishlist';
import { useUserStore } from '@/entities/user';
import { useEffect } from 'react';

/**
 * Провайдер для автоматической синхронизации stores с сервером при загрузке
 */
export function StoreSyncProvider({ children }: { children: React.ReactNode }) {
  const syncCart = useCartStore((state) => state.syncWithServer);
  const syncWishlist = useWishlistStore((state) => state.syncWithServer);

  useEffect(() => {
    // Синхронизируем корзину и избранное при загрузке приложения
    const syncStores = async () => {
      // Use user from Zustand store (more reliable than reading httpOnly cookie)
      const user = useUserStore.getState().user;
      if (user?._id) {
        try {
          await Promise.all([syncCart(), syncWishlist()]);
        } catch (error) {
          console.error('Error syncing stores:', error);
        }
      }
    };

    syncStores();
  }, [syncCart, syncWishlist]);

  return <>{children}</>;
}
