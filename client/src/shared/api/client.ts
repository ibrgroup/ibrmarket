import { useUserStore } from '@/entities/user';
import { authService } from '@/shared/api/services/auth-service';
import { getToken, removeToken as removeCookieToken } from '@/shared/lib/auth';
import { REFRESH_401_COOLDOWN_MS } from '@/shared/lib/auth-constants';
import { devLog } from '@/shared/lib/logger';
import type { ApiResponse, HttpMethod } from './types';

/**
 * Класс-обёртка для HTTP-запросов к бэкенду с поддержкой авторизации и рефреша токена.
 * Все экспорты через public API этого файла.
 */

/** Успешный refresh без тела токена — повторяем запрос с credentials (новый access в httpOnly) */
const REFRESH_COOKIE_ONLY = '\0refresh:cookie-only';

class ApiClient {
  private baseURL: string;

  /** Один refresh в полёте — все 401 ждут один и тот же refresh */
  private refreshPromise: Promise<string | null> | null = null;
  /** После неудачного refresh не вызывать refresh снова до истечения cooldown */
  private skipRefreshUntil = 0;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com') {
    // Убираем trailing slash для единообразия
    this.baseURL = baseURL.trim().replace(/\/+$/, '');

    // В development логируем baseURL для отладки
    if (process.env.NODE_ENV === 'development') {
      console.info('🔧 [API Client] Base URL:', this.baseURL);
    }
  }

  /**
   * Базовый метод для HTTP-запросов, реализует автоматическую авторизацию и рефреш токена.
   * @param endpoint - API endpoint (абсолютный или относительный)
   * @param method - HTTP-метод ('GET', 'POST', и др.)
   * @param data - Данные запроса (body)
   * @param headers - Дополнительные заголовки
   */
  private async request<T>(
    endpoint: string,
    method: HttpMethod = 'GET',
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    // Prefer same-origin /api proxy when available.
    // This is CRITICAL in production to avoid third-party cookie blocking (Vercel -> Render).
    const shouldUseRelative = typeof window !== 'undefined' && endpoint.startsWith('/api/');
    const url = shouldUseRelative ? endpoint : `${this.baseURL}${endpoint}`;

    // Авторизация: try Zustand store first, then cookie fallback
    // CRITICAL: httpOnly cookies can't be read via document.cookie
    // But credentials: 'include' will send cookie automatically
    // NOTE: After page reload, token may be missing from Zustand, but cookie will still be sent
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      // Try Zustand store first (token stored after login)
      try {
        const { useUserStore } = await import('@/entities/user');
        token = useUserStore.getState().token;
      } catch {
        // Fallback to cookie (won't work for httpOnly, but credentials: 'include' handles it)
        token = getToken();
      }
    }
    // Authorization header is optional - cookie will be sent via credentials: 'include'
    // But we send it if available for better compatibility with mobile/future clients
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const buildConfig = (extraHeaders?: Record<string, string>): RequestInit => {
      const isFormData = data instanceof FormData;
      const baseHeaders: Record<string, string> = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...authHeaders,
        ...(headers || {}),
        ...(extraHeaders || {}),
      };
      // CRITICAL: credentials: 'include' — иначе cookie (accessToken/refreshToken) не отправляются cross-origin и бэкенд вернёт "Provide token"
      const cfg: RequestInit = {
        method,
        headers: baseHeaders,
        credentials: 'include',
      };
      if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        cfg.body = isFormData ? data : JSON.stringify(data);
      }
      return cfg;
    };

    const attempt = async (cfg: RequestInit): Promise<Response> => {
      try {
        // Логирование запроса в режиме разработки
        if (process.env.NODE_ENV === 'development') {
          console.info(`📤 [API Client] ${method} ${url}`, {
            headers: cfg.headers,
            body: data
              ? data instanceof FormData
                ? '[FormData]'
                : JSON.stringify(data)
              : undefined,
          });
        }
        return await fetch(url, cfg);
      } catch (err) {
        const errorMsg = `Network error while fetching ${url}: ${String(err)}`;
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ [API Client] Network error:', errorMsg);
        }
        throw new Error(errorMsg);
      }
    };

    // Первый запрос
    let response = await attempt(buildConfig());
    if (response.status === 401 && typeof window !== 'undefined') {
      const { authStatus } = useUserStore.getState();
      // Только явный гость: при `unknown` / до завершения rehydrate как раз нужен refresh
      // (просроченный access + валидный refresh в httpOnly cookie).
      if (authStatus === 'unauthenticated') {
        devLog.warn('[API Client] Skipping refresh - session marked unauthenticated');
        removeCookieToken();
        return { data: { error: true, message: 'Unauthorized' } as T };
      }

      if (Date.now() < this.skipRefreshUntil) {
        devLog.warn('[API Client] Skipping refresh - within cooldown after previous failure');
        return { data: { error: true, message: 'Unauthorized' } as T };
      }

      const runRefresh = async (): Promise<string | null> => {
        const stateBefore = useUserStore.getState();
        if (stateBefore.authStatus === 'unauthenticated') return null;
        try {
          const refreshed = await authService.refreshToken();
          const stateAfter = useUserStore.getState();
          if (stateAfter.authStatus === 'unauthenticated') return null;
          if (refreshed.token) {
            const { setToken } = useUserStore.getState();
            setToken(refreshed.token);
            return refreshed.token;
          }
          // 2xx, но access только через Set-Cookie — повторим исходный запрос с credentials
          return REFRESH_COOKIE_ONLY;
        } catch {
          this.skipRefreshUntil = Date.now() + REFRESH_401_COOLDOWN_MS;
          const stateAfter = useUserStore.getState();
          if (stateAfter.isAuthenticated) {
            const { logout } = useUserStore.getState();
            await logout();
            const { setToken } = useUserStore.getState();
            setToken('');
            removeCookieToken();
          }
          return null;
        }
      };

      if (!this.refreshPromise) {
        this.refreshPromise = runRefresh();
      }
      let newToken: string | null = null;
      try {
        newToken = await this.refreshPromise;
      } finally {
        this.refreshPromise = null;
      }

      if (newToken === REFRESH_COOKIE_ONLY) {
        response = await attempt(buildConfig());
      } else if (newToken) {
        response = await attempt(buildConfig({ Authorization: `Bearer ${newToken}` }));
      }
    }

    // Обработка ответа
    let result: unknown = {};
    let responseText = '';

    try {
      // Сначала пытаемся получить текст ответа
      responseText = await response.text();
      // Пытаемся распарсить как JSON
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          // Если не JSON, используем текст как есть
          result = { error: responseText || `HTTP error! status: ${response.status}` };
        }
      }
    } catch (err) {
      // Если не удалось получить текст, используем пустой объект
      result = { error: `Failed to read response: ${String(err)}` };
    }

    // Проверяем, является ли ответ ошибкой (по статусу или по полю error в ответе)
    const resultObj = result as Record<string, unknown>;
    const isErrorResponse =
      !response.ok ||
      (typeof resultObj === 'object' &&
        resultObj !== null &&
        (resultObj.error === true || resultObj.success === false));

    if (isErrorResponse) {
      // Универсальная обработка ошибок (сообщения и структура от бэкенда)
      let errorMessage: string | undefined;
      if (typeof resultObj === 'object' && resultObj !== null) {
        const msg = resultObj.message;
        if (typeof msg === 'string' && msg.trim()) errorMessage = msg;
        else if (Array.isArray(msg)) errorMessage = msg.map(String).filter(Boolean).join('; ');
        else if (typeof resultObj.error === 'string') errorMessage = resultObj.error;
      }
      if (!errorMessage && typeof result === 'string') errorMessage = result;

      // Если сообщение не найдено, создаем понятное сообщение на основе статуса
      if (!errorMessage) {
        switch (response.status) {
          case 400:
            errorMessage = 'Неверный запрос. Проверьте введенные данные.';
            break;
          case 401:
            errorMessage = 'Необходима авторизация.';
            break;
          case 403:
            errorMessage = 'Доступ запрещен.';
            break;
          case 404:
            errorMessage = 'Ресурс не найден.';
            break;
          case 500:
            errorMessage = 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Сервер временно недоступен. Пожалуйста, попробуйте позже.';
            break;
          default:
            errorMessage = `Ошибка сервера (${response.status}). Пожалуйста, попробуйте позже.`;
        }
      }

      // Для разработки выводим подробную ошибку в консоль
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ API Error [${response.status}]:`, {
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          responseData: result as Record<string, unknown>,
          responseText: responseText.substring(0, 500), // Первые 500 символов
          requestData: data
            ? typeof data === 'string'
              ? data
              : JSON.stringify(data, null, 2)
            : undefined,
        });
      }

      const err = new Error(errorMessage) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    // Если ответ успешный, возвращаем распарсенный JSON или пустой объект
    return result && typeof result === 'object' ? result : {};
  }

  // GET запрос
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET', undefined, headers);
  }

  // POST запрос
  async post<T>(
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'POST', data, headers);
  }

  // PUT запрос
  async put<T>(
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PUT', data, headers);
  }

  // DELETE запрос (body нужен для bulk-эндпоинтов вроде /deleteMultiple)
  async delete<T>(
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'DELETE', data, headers);
  }

  // PATCH запрос
  async patch<T>(
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PATCH', data, headers);
  }

  /** Сброс cooldown после неудачного refresh (вызывать после успешного входа) */
  clearRefreshCooldown(): void {
    this.skipRefreshUntil = 0;
  }
}

export const apiClient = new ApiClient();

export default apiClient;
