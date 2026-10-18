/**
 * Hook для защиты действий, требующих авторизации
 */

'use client';

import { useCallback } from 'react';

import { useAuth } from '@/features/auth';
import { useUserStore } from '@/entities/user';

import { useAuthModalStore } from '../../model/auth-modal.store';
import type { AuthIntent } from '../../model/types';

/**
 * Hook для проверки авторизации перед выполнением действия
 *
 * Если пользователь не авторизован, открывается модальное окно авторизации
 * После успешной авторизации callback будет выполнен автоматически
 *
 * @example
 * ```tsx
 * function CheckoutButton() {
 *   const requireAuth = useRequireAuth();
 *
 *   const handleCheckout = () => {
 *     requireAuth(() => {
 *       // Этот код выполнится только если пользователь авторизован
 *       router.push('/checkout');
 *     }, { type: 'checkout' });
 *   };
 *
 *   return <button onClick={handleCheckout}>Оформить заказ</button>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Использование с async callback
 * function AddToWishlistButton({ productId }: { productId: string }) {
 *   const requireAuth = useRequireAuth();
 *   const { addToWishlist } = useWishlistStore();
 *
 *   const handleAddToWishlist = async () => {
 *     await requireAuth(async () => {
 *       await addToWishlist(productId);
 *       toast.success('Добавлено в избранное');
 *     });
 *   };
 *
 *   return <button onClick={handleAddToWishlist}>В избранное</button>;
 * }
 * ```
 */
export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const authStatus = useUserStore((state) => state.authStatus);
  const { open } = useAuthModalStore();

  /**
   * Выполнить callback, если пользователь авторизован
   * Иначе открыть модальное окно авторизации
   *
   * @param callback - Функция для выполнения после авторизации
   * @param intent - Действие после успешного входа (для модалки)
   * @returns Promise<void>
   */
  const requireAuth = useCallback(
    async <T = void>(
      callback: () => T | Promise<T>,
      intent?: AuthIntent
    ): Promise<T | undefined> => {
      // CRITICAL: Do NOT fire guards while auth is being resolved
      if (authStatus === 'unknown') {
        // Auth is being restored from cookies - wait
        return undefined;
      }

      if (isAuthenticated && authStatus === 'authenticated') {
        // Пользователь авторизован - выполняем callback
        return await callback();
      } else {
        // Пользователь не авторизован - открываем модалку
        open(intent);
        return undefined;
      }
    },
    [isAuthenticated, authStatus, open]
  );

  return requireAuth;
}

/**
 * Простой hook для проверки авторизации с автоматическим открытием модалки
 *
 * @deprecated Use `useRequireAuth` instead. This hook doesn't check `authStatus` and may show auth UI prematurely during rehydration.
 *
 * @example
 * ```tsx
 * function ProtectedButton() {
 *   const { checkAuth } = useAuthGuard();
 *
 *   const handleClick = () => {
 *     if (!checkAuth({ type: 'checkout' })) {
 *       return; // Модалка открыта, ждем авторизации
 *     }
 *     // Пользователь авторизован
 *     router.push('/checkout');
 *   };
 *
 *   return <button onClick={handleClick}>Оформить</button>;
 * }
 * ```
 */
export function useAuthGuard() {
  const { isAuthenticated } = useAuth();
  const authStatus = useUserStore((state) => state.authStatus);
  const { open } = useAuthModalStore();

  /**
   * Проверить авторизацию
   *
   * CRITICAL: Checks authStatus to prevent premature auth UI during rehydration
   *
   * @param intent - Действие после успешного входа
   * @returns true если пользователь авторизован, false иначе
   */
  const checkAuth = useCallback(
    (intent?: AuthIntent): boolean => {
      // CRITICAL: Do NOT fire guards while auth is being resolved
      if (authStatus === 'unknown') {
        // Auth is being restored from cookies - wait
        return false;
      }

      if (isAuthenticated && authStatus === 'authenticated') {
        return true;
      }
      open(intent);
      return false;
    },
    [isAuthenticated, authStatus, open]
  );

  return {
    checkAuth,
    isAuthenticated,
  };
}
