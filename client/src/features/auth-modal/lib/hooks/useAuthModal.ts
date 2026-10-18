/**
 * Hook для работы с модальным окном авторизации
 */

'use client';

import { useCallback } from 'react';

import { useAuthModalStore } from '../../model/auth-modal.store';
import type { AuthIntent } from '../../model/types';

/**
 * Hook для управления модальным окном авторизации
 *
 * @example
 * ```tsx
 * function Component() {
 *   const { openAuthModal } = useAuthModal();
 *
 *   return (
 *     <button onClick={() => openAuthModal()}>
 *       Войти
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Открыть модалку с intent для checkout
 * function CheckoutButton() {
 *   const { openAuthModal } = useAuthModal();
 *
 *   const handleCheckout = () => {
 *     openAuthModal({ type: 'checkout' });
 *   };
 *
 *   return <button onClick={handleCheckout}>Оформить заказ</button>;
 * }
 * ```
 */
export function useAuthModal() {
  const { open, close, isOpen } = useAuthModalStore();

  const openAuthModal = useCallback(
    (intent?: AuthIntent) => {
      open(intent);
    },
    [open]
  );

  const closeAuthModal = useCallback(() => {
    close();
  }, [close]);

  return {
    openAuthModal,
    closeAuthModal,
    isAuthModalOpen: isOpen,
  };
}
