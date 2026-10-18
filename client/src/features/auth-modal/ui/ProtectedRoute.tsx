/**
 * Компонент-обертка для защиты страниц, требующих авторизации
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth';
import { useUserStore } from '@/entities/user';

import { useAuthModalStore } from '../model/auth-modal.store';
import type { AuthIntent } from '../model/types';

interface ProtectedRouteProps {
  /** Контент, который нужно защитить */
  children: React.ReactNode;
  /** Intent для модалки авторизации */
  intent?: AuthIntent;
  /** URL для редиректа если пользователь не авторизован (опционально) */
  redirectTo?: string;
  /** Показывать loading пока идет проверка авторизации */
  showLoading?: boolean;
}

/**
 * Компонент-обертка для защиты страниц
 *
 * @example
 * ```tsx
 * export default function CheckoutPage() {
 *   return (
 *     <ProtectedRoute intent={{ type: 'checkout' }}>
 *       <CheckoutContent />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */
export function ProtectedRoute({
  children,
  intent,
  redirectTo,
  showLoading = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized } = useAuth();
  const authStatus = useUserStore((state) => state.authStatus);
  const { open } = useAuthModalStore();
  const router = useRouter();

  useEffect(() => {
    // CRITICAL: Wait for auth to be resolved (not 'unknown')
    // Do NOT fire guards/logout while auth is being restored from cookies
    if (authStatus === 'unknown' || !isInitialized) {
      return;
    }

    // If user is not authenticated (authStatus === 'unauthenticated')
    if (!isAuthenticated || authStatus === 'unauthenticated') {
      // Если указан redirectTo - делаем редирект
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      // Иначе открываем модалку авторизации
      open(intent);
    }
  }, [isAuthenticated, isInitialized, authStatus, open, intent, redirectTo, router]);

  // Показываем loading пока auth is being resolved or not initialized
  if ((authStatus === 'unknown' || !isInitialized) && showLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если не авторизован - ничего не показываем (модалка откроется)
  if (!isAuthenticated) {
    return null;
  }

  // Пользователь авторизован - показываем контент
  return <>{children}</>;
}
