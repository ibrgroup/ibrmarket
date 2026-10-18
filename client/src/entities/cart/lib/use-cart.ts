'use client';

import { useEffect } from 'react';
import { useCartStore } from '../model/cart.store';

/**
 * Хук для работы с корзиной.
 *
 * CRITICAL: Sync is handled by:
 * 1. onRehydrateStorage in user.store.ts (for authenticated users on page load)
 * 2. StoreSyncProvider (for authenticated users on app mount)
 * 3. Manual calls from components when needed
 *
 * - Поддерживает строгую типизацию.
 * - Корректно организует импорты и возвращает публичный API корзины.
 */
export const useCart = () => {
  const {
    items,
    totalPrice,
    totalItems,
    isLoading,
    error,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
    syncWithServer,
    calculateTotals,
  } = useCartStore();

  // CRITICAL: Sync is handled by:
  // 1. onRehydrateStorage in user.store.ts (for authenticated users on page load)
  // 2. StoreSyncProvider (for authenticated users on app mount)
  // 3. Manual calls from components when needed
  //
  // We don't need to sync here to avoid duplicate calls and race conditions.
  // The sync will happen automatically when user is authenticated.

  // 3. Пересчет тоталов при изменении items (мемоизировано селектором Zustand).
  useEffect(() => {
    calculateTotals();
  }, [items, calculateTotals]);

  return {
    items,
    totalPrice,
    totalItems,
    isLoading,
    error,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
    syncWithServer,
    // isInCart селектор инлайном, строго типизирован
    isInCart: useCartStore(state => state.isInCart),
  };
};
