import { jwtDecode } from 'jwt-decode';
import { NextRequest, NextResponse } from 'next/server';

import type { UserRole } from './user-roles';

export interface JwtPayload {
  exp: number;
  iat: number;
  id?: string;
  userId?: string;
  email?: string;
  /** Present on access tokens issued after role claim was added; omit on legacy tokens */
  role?: UserRole;
  jti?: string;
  sessionId?: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Import from centralized constants
import {
  ACCESS_TOKEN_COOKIE_NAME,
  EXTENDED_TOKEN_LIFETIME_SECONDS as EXTENDED_LIFETIME,
  REFRESH_TOKEN_COOKIE_NAME,
} from './auth-constants';

export const TOKEN_KEY = ACCESS_TOKEN_COOKIE_NAME;
export const REFRESH_TOKEN_KEY = REFRESH_TOKEN_COOKIE_NAME;

// Re-export for backwards compatibility
export const EXTENDED_TOKEN_LIFETIME_SECONDS = EXTENDED_LIFETIME;

/**
 * Читает значение cookie по ключу (клиент-сайд)
 */
export const getCookie = (key: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + key.replace(/([.$?*|{}()[\]\\^])/g, '\\$1') + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Устанавливает cookie (клиент-сайд)
 *
 * ⚠️ НЕ ИСПОЛЬЗУЙТЕ для auth cookies (accessToken/refreshToken)!
 *
 * Backend устанавливает auth cookies как httpOnly через res.cookie().
 * Установка cookie с тем же именем через document.cookie создаёт:
 * - Два cookie с одинаковым именем (browser confusion)
 * - XSS уязвимость (client-side cookie не protected)
 * - Несоответствие SameSite/Secure/Path настроек
 *
 * @param key - Cookie name (NOT for auth cookies!)
 * @param value - Cookie value
 * @param maxAgeSeconds - Max age in seconds (default: 60 days)
 */
export const setCookie = (
  key: string,
  value: string,
  maxAgeSeconds: number = EXTENDED_TOKEN_LIFETIME_SECONDS,
): void => {
  if (typeof document === 'undefined') return;
  const parts = [`${key}=${encodeURIComponent(value)}`, 'path=/', 'SameSite=Lax'];
  if (maxAgeSeconds && maxAgeSeconds > 0) {
    parts.push(`Max-Age=${maxAgeSeconds}`);
  }
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('Secure');
  }
  document.cookie = parts.join('; ');
};

/**
 * Удаляет cookie (клиент-сайд)
 */
export const deleteCookie = (key: string): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `${key}=; Max-Age=0; path=/; SameSite=Lax`;
};

/**
 * Получает access token из cookie (клиент-сайд)
 *
 * ⚠️ ВАЖНО: Эта функция НЕ работает для httpOnly cookies!
 *
 * Если backend устанавливает accessToken как httpOnly cookie,
 * эта функция вернёт null даже когда пользователь аутентифицирован.
 *
 * ВМЕСТО ЭТОГО используйте:
 * - Zustand store: `useUserStore.getState().token`
 * - API вызовы: backend читает cookie автоматически через `credentials: 'include'`
 *
 * Эта функция оставлена для:
 * - Обратной совместимости
 * - Случаев когда cookie НЕ httpOnly (legacy поддержка)
 * - BroadcastChannel синхронизации между вкладками
 *
 * @returns Token string or null (null for httpOnly cookies!)
 */
export const getToken = (): string | null => {
  return getCookie(TOKEN_KEY);
};

/**
 * @deprecated НЕ ИСПОЛЬЗУЙТЕ ДЛЯ УСТАНОВКИ AUTH COOKIES!
 *
 * ❌ ПРОБЛЕМА: Backend устанавливает accessToken как httpOnly cookie.
 * Если frontend также устанавливает cookie с тем же именем,
 * это создаёт два cookie (XSS уязвимость, dual cookie problem).
 *
 * ✅ ПРАВИЛЬНЫЙ ПОДХОД:
 * - Backend устанавливает httpOnly cookies через res.cookie()
 * - Frontend только читает token из Zustand store (из API response)
 * - Cookie отправляются автоматически через `credentials: 'include'`
 *
 * Эта функция оставлена ТОЛЬКО для обратной совместимости.
 * Все новые вызовы должны использовать Zustand store.
 *
 * @deprecated Use Zustand store instead - backend sets httpOnly cookies
 */
export const setToken = (
  token: string,
  _refreshToken?: string,
  maxAgeSeconds: number = EXTENDED_TOKEN_LIFETIME_SECONDS,
): void => {
  // WARNING: This creates a non-httpOnly cookie with same name as backend's httpOnly cookie
  // This is a security vulnerability (dual cookie setting)
  // Only kept for backward compatibility
  setCookie(TOKEN_KEY, token, maxAgeSeconds);
};

/**
 * Удаляет access token cookie (клиент-сайд)
 */
export const removeToken = (): void => {
  deleteCookie(TOKEN_KEY);
};

/**
 * Декодирует JWT токен
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch (error) {
    // В production не логируем детали ошибок
    // Ошибки декодирования токена - это нормальная ситуация (истекший токен и т.д.)
    return null;
  }
};

/**
 * Проверяет, истек ли токен
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded) return true;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

/**
 * Проверяет, авторизован ли пользователь
 *
 * ⚠️ ВНИМАНИЕ: Эта функция НЕ надёжна для httpOnly cookies!
 *
 * Если accessToken установлен как httpOnly, getToken() вернёт null,
 * и эта функция вернёт false даже для аутентифицированных пользователей.
 *
 * ВМЕСТО ЭТОГО используйте:
 * - Zustand store: `useUserStore.getState().isAuthenticated`
 * - API вызов: `userService.getProfile()` (backend проверит cookie)
 *
 * @returns false for httpOnly cookies! Use Zustand store instead.
 */
export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
};

/**
 * @deprecated REMOVED: getUserFromToken() - архитектурный антипаттерн
 *
 * ❌ НЕ ИСПОЛЬЗУЙТЕ: JWT декодирование в бизнес-логике создает двойной источник истины
 *
 * ✅ ВМЕСТО ЭТОГО используйте:
 *
 * **Клиент-сайд (React компоненты/хуки):**
 * ```typescript
 * import { useUserStore } from '@/entities/user';
 * const user = useUserStore((state) => state.user);
 * const userId = user?._id || user?.id;
 * ```
 *
 * **Клиент-сайд (stores/services вне React):**
 * ```typescript
 * import { useUserStore } from '@/entities/user';
 * const user = useUserStore.getState().user;
 * const userId = user?._id || user?.id;
 * ```
 *
 * **Сервер-сайд (API routes / Server Components):**
 * ```typescript
 * import { verifySession } from '@/shared/lib/auth-server';
 * const { user } = verifySession(request);
 * ```
 *
 * **Rehydration (перезагрузка страницы):**
 * ```typescript
 * // Проверка через API - backend читает httpOnly cookie автоматически
 * const profile = await userService.getProfile();
 * ```
 *
 * См. также: src/shared/lib/auth-rules.md
 */

/**
 * @deprecated НЕ ИСПОЛЬЗУЙТЕ - используйте middleware.ts напрямую
 *
 * Этот guard был перенесён в src/middleware.ts который:
 * - Использует Edge Runtime
 * - Имеет grace period для предотвращения redirect loops
 * - Центрально управляет защищёнными и публичными путями
 *
 * @see src/middleware.ts
 */
export const authGuard = async (request: NextRequest): Promise<NextResponse> => {
  console.warn('[auth] authGuard is deprecated, use middleware.ts instead');
  const token = request.cookies.get(TOKEN_KEY)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isTokenExpired(token)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
};

/**
 * @deprecated НЕ ИСПОЛЬЗУЙТЕ - используйте middleware.ts напрямую
 *
 * Этот guard был перенесён в src/middleware.ts
 *
 * @see src/middleware.ts
 */
export const publicGuard = async (request: NextRequest): Promise<NextResponse> => {
  console.warn('[auth] publicGuard is deprecated, use middleware.ts instead');
  const token = request.cookies.get(TOKEN_KEY)?.value;

  if (token && !isTokenExpired(token)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
};

/**
 * HOC для защиты компонентов (клиент-сайд)
 * Экспортируется из auth-client.ts для использования в клиентских компонентах
 */
export { withAuth } from './auth-client';

/**
 * @deprecated НЕ ИСПОЛЬЗУЙТЕ - не работает с httpOnly cookies!
 *
 * Эта функция полагается на getToken() который не может читать httpOnly cookies.
 *
 * ВМЕСТО ЭТОГО:
 * - Используйте useAuth() hook который управляет refresh автоматически
 * - Или вызовите authService.refreshToken() напрямую
 *
 * @deprecated Use useAuth() hook instead
 */
export const refreshTokenIfNeeded = async (): Promise<boolean> => {
  const token = getToken();
  // refresh токен хранится в httpOnly cookie, frontend не может его читать
  if (!token) return false;
  if (isTokenExpired(token)) {
    return false;
  }
  return true;
};
