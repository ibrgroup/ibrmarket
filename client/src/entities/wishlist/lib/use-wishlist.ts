'use client';

import { useWishlistStore } from '../model/wishlist.store';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Хук для работы с избранным
 *
 * CRITICAL: Sync is handled by:
 * 1. onRehydrateStorage in user.store.ts (for authenticated users on page load)
 * 2. StoreSyncProvider (for authenticated users on app mount)
 * 3. Manual calls from components when needed
 */
export const useWishlist = () => {
  const queryClient = useQueryClient();
  const {
    items,
    isLoading,
    error,
    addItem: originalAddItem,
    removeItem: originalRemoveItem,
    removeItemByProductId: originalRemoveItemByProductId,
    isInWishlist,
    syncWithServer,
    clearWishlist,
  } = useWishlistStore();

  // Обертки для addItem и removeItem с инвалидацией кэша React Query
  const addItem = async (product: Parameters<typeof originalAddItem>[0]) => {
    await originalAddItem(product);
    // Инвалидируем кэш wishlist после добавления
    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
  };

  const removeItem = async (id: string) => {
    await originalRemoveItem(id);
    // Инвалидируем кэш wishlist после удаления
    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
  };

  const removeItemByProductId = async (productId: string) => {
    await originalRemoveItemByProductId(productId);
    // Инвалидируем кэш wishlist после удаления
    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
  };

  // CRITICAL: Sync is handled by:
  // 1. onRehydrateStorage in user.store.ts (for authenticated users on page load)
  // 2. StoreSyncProvider (for authenticated users on app mount)
  // 3. Manual calls from components when needed
  //
  // We don't need to sync here to avoid duplicate calls and race conditions.
  // The sync will happen automatically when user is authenticated.

  return {
    items,
    isLoading,
    error,
    addItem,
    removeItem,
    removeItemByProductId, // Удаление по productId
    isInWishlist,
    syncWithServer,
    clearWishlist,
  };
};
