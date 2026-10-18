import { ACCESS_TOKEN_COOKIE_NAME } from '@/shared/lib/auth-constants';
import { cookies, headers } from 'next/headers';

/**
 * Есть ли access token во входящем запросе (в т.ч. httpOnly cookie).
 * Без него многие маршруты бэка отвечают 401 — prefetch лучше не вызывать, чтобы не шуметь в логах.
 */
export async function incomingRequestHasAccessToken(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get(ACCESS_TOKEN_COOKIE_NAME)?.value);
}

/**
 * Заголовки для запросов из RSC/prefetch к бэкенду.
 * Серверный fetch на другой origin не подставляет cookies браузера — их нужно передать явно.
 */
export async function getRscApiForwardHeaders(): Promise<Record<string, string> | undefined> {
  const h = await headers();
  const cookie = h.get('cookie');
  if (!cookie?.trim()) return undefined;

  const out: Record<string, string> = { Cookie: cookie };

  const safeName = ACCESS_TOKEN_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokenMatch = new RegExp(`(?:^|;\\s*)${safeName}=([^;]*)`).exec(cookie);
  if (tokenMatch?.[1]) {
    const raw = tokenMatch[1].trim();
    const value = (() => {
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    })();
    if (value) out.Authorization = `Bearer ${value}`;
  }

  return out;
}
