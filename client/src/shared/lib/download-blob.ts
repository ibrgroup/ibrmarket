'use client';

import { REFRESH_401_COOLDOWN_MS } from '@/shared/lib/auth-constants';

let skipRefreshUntil = 0;
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (Date.now() < skipRefreshUntil) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const { useUserStore } = await import('@/entities/user');
        if (useUserStore.getState().authStatus === 'unauthenticated') return false;

        const { authService } = await import('@/shared/api/services/auth-service');
        const refreshed = await authService.refreshToken();
        if (useUserStore.getState().authStatus === 'unauthenticated') return false;

        if (refreshed.token) {
          useUserStore.getState().setToken(refreshed.token);
        }
        return true;
      } catch {
        skipRefreshUntil = Date.now() + REFRESH_401_COOLDOWN_MS;
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

async function buildAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    const { useUserStore } = await import('@/entities/user');
    const token = useUserStore.getState().token;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* ignore */
  }
  return headers;
}

/**
 * GET binary/text export with the same auth strategy as apiClient:
 * - browser always uses same-origin `/api/...` (Next rewrite/proxy → cookies work on Vercel)
 * - credentials include + optional Bearer
 * - one 401 → refresh → retry
 */
export async function downloadBlobFromApi(endpoint: string, filename: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if (!endpoint.startsWith('/api/')) {
    throw new Error('Export endpoint must be a same-origin /api/ path');
  }

  const attempt = async (): Promise<Response> => {
    const headers = await buildAuthHeaders();
    return fetch(endpoint, { credentials: 'include', headers });
  };

  let res = await attempt();
  if (res.status === 401) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      res = await attempt();
    }
  }

  if (!res.ok) {
    let detail = '';
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const body = (await res.json()) as { message?: string };
        detail = body.message?.trim() || '';
      } else {
        detail = (await res.text()).trim().slice(0, 200);
      }
    } catch {
      /* ignore */
    }
    const suffix = detail ? `: ${detail}` : '';
    throw new Error(`Не удалось скачать экспорт (${res.status})${suffix}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    let message = 'Сервер вернул JSON вместо CSV';
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message?.trim()) message = body.message.trim();
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  if (!blob.size) {
    throw new Error('Экспорт пустой — нет данных по текущим фильтрам');
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
