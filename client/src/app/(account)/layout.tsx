import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { decodeToken, isTokenExpired } from '@/shared/lib/auth';

/**
 * Protected layout for account routes
 *
 * Защищает все роуты внутри группы (account):
 * - /my-account (protected)
 * - /my-orders (protected)
 * - /payment (protected)
 *
 * NOTE: /wishlist is in separate group (wishlist) and is public (supports guest mode)
 *
 * Примечания по безопасности:
 * - Использует только декодирование JWT на сервере (без проверки подписи)
 * - Декодированный токен нужен только для оптимистичного UI, сервер — источник истины
 * - Proxy уже обрабатывает редиректы для неавторизованных пользователей
 * - Если токен отсутствует или истёк, proxy перенаправит на главную
 *   (модалка авторизации откроется при попытке доступа к защищённым действиям)
 */
export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}): Promise<React.ReactNode> {
  // Получение accessToken из серверных cookies
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  // Проверяем токен для оптимистичного UI
  // CRITICAL: Proxy уже обрабатывает редиректы, здесь только проверка для UI
  if (!accessToken || isTokenExpired(accessToken)) {
    // Proxy обработает редирект, здесь просто возвращаем children
    // Client-side компоненты проверят авторизацию через useAuth
    return <>{children}</>;
  }

  // Пробуем декодировать токен для оптимистичного UI
  const decoded = decodeToken(accessToken);

  if (!decoded) {
    // Proxy обработает редирект, здесь просто возвращаем children
    return <>{children}</>;
  }

  // Авторизованный пользователь — рендерим children
  return <>{children}</>;
}
