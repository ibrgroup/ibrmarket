import type { User } from '@/entities/user';
import { normalizeContact } from '@/shared/lib/contact-utils';
import { apiClient } from '../client';

// ============================================================
// OTP AUTHENTICATION TYPES (NEW)
// ============================================================

export interface SendOtpRequest {
  contact: string; // email или phone
  method: 'email' | 'phone';
  name?: string; // опционально для регистрации
}

export interface VerifyOtpRequest {
  contact: string;
  otp: string;
  method: 'email' | 'phone';
}

export interface SendOtpResponse {
  message: string;
  success: boolean;
}

/**
 * Типы для ответов API (сырые данные от бэкенда)
 */
interface RawAuthResponse {
  data?: {
    user?: Partial<User>;
    token?: string;
    accesstoken?: string;
    accessToken?: string;
    // refreshToken is in httpOnly cookie, not in response body
  };
  user?: Partial<User>;
  token?: string;
  accesstoken?: string;
  accessToken?: string;
  // refreshToken is in httpOnly cookie, not in response body
}

interface RawSendOtpResponse {
  message?: string;
  success?: boolean;
}

// ============================================================
// OLD TYPES (DEPRECATED - WILL BE REMOVED)
// ============================================================

export interface AuthResponse {
  user?: Partial<User>;
  token: string;
  // refreshToken is in httpOnly cookie set by backend, not in response
}

export interface RefreshTokenResponse {
  token: string;
  // CRITICAL: refreshToken is NOT returned - it's in httpOnly cookie set by backend
}

class AuthService {
  private readonly endpoints = {
    // NEW OTP endpoints
    sendOtp: '/api/user/send-otp',
    verifyOtp: '/api/user/verify-otp',
    resendOtp: '/api/user/resend-otp',
    logout: '/api/user/logout',
    refresh: '/api/user/refresh-token',
  };

  private normalizeAuthResponse(raw: RawAuthResponse): AuthResponse {
    // Backend returns { data: { accesstoken, ... } } or { accesstoken, ... }
    // refreshToken is in httpOnly cookie, not in response body
    const data = raw?.data ?? raw;
    // Backend может вернуть token в разных полях: token, accesstoken, accessToken
    const token = data?.token ?? data?.accesstoken ?? data?.accessToken ?? '';

    // CRITICAL: Если токен пустой, это ошибка - бросаем исключение
    if (!token) {
      console.error('[AuthService] Token not found in response:', raw);
      throw new Error('Токен не получен от сервера. Попробуйте войти снова.');
    }

    return {
      user: data?.user,
      token,
      // refreshToken is in httpOnly cookie set by backend, not in response
    };
  }

  private normalizeRefreshResponse(raw: RawAuthResponse): RefreshTokenResponse {
    const data = raw?.data ?? raw;
    return {
      token: data?.token ?? data?.accesstoken ?? data?.accessToken ?? '',
      // CRITICAL: refreshToken is NOT returned - it's in httpOnly cookie set by backend
    };
  }

  // ============================================================
  // OTP AUTHENTICATION METHODS (NEW)
  // ============================================================

  /**
   * Отправка OTP кода на email или телефон
   * Нормализует контакт перед отправкой
   *
   * В dev режиме (NEXT_PUBLIC_SKIP_OTP_SEND=true) пропускает реальную отправку
   */
  async sendOtp(data: SendOtpRequest): Promise<SendOtpResponse> {
    // Нормализуем контакт в сервисе (бизнес-логика)
    const normalizedContact = normalizeContact(data.contact, data.method);
    if (!normalizedContact) {
      throw new Error(
        data.method === 'phone'
          ? 'Неверный формат номера телефона'
          : 'Неверный формат email адреса',
      );
    }

    // Dev режим: пропускаем реальную отправку для тестирования
    const skipOtpSend = process.env.NEXT_PUBLIC_SKIP_OTP_SEND === 'true';
    if (skipOtpSend) {
      console.info('[DEV MODE] OTP отправка пропущена:', {
        contact: normalizedContact,
        method: data.method,
      });
      return {
        message: 'Код отправлен (dev режим)',
        success: true,
      };
    }

    const response = await apiClient.post<RawSendOtpResponse>(this.endpoints.sendOtp, {
      ...data,
      contact: normalizedContact,
    });
    // API может вернуть либо { data: {...} }, либо напрямую {...}
    // Извлекаем данные из ответа
    // Тип ApiResponse<T> имеет структуру { data?: T; message?: string; ... }
    // Но бэкенд может вернуть данные напрямую без обертки ApiResponse
    let responseData: RawSendOtpResponse;
    if ('data' in response && response.data) {
      responseData = response.data;
    } else {
      // Если response сам является RawSendOtpResponse (нестандартный формат от бэкенда)
      // Используем as unknown as для безопасного приведения типа
      responseData = response as unknown as RawSendOtpResponse;
    }
    return {
      message: responseData?.message ?? 'Код отправлен',
      success: responseData?.success ?? true,
    };
  }

  /**
   * Верификация OTP кода и вход в систему
   * Нормализует контакт перед отправкой
   *
   * В dev режиме (NEXT_PUBLIC_SKIP_OTP_SEND=true) использует моковый ответ
   * или специальный dev OTP код (NEXT_PUBLIC_DEV_OTP_CODE)
   */
  async verifyOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
    // Нормализуем контакт в сервисе (бизнес-логика)
    const normalizedContact = normalizeContact(data.contact, data.method);
    if (!normalizedContact) {
      throw new Error(
        data.method === 'phone'
          ? 'Неверный формат номера телефона'
          : 'Неверный формат email адреса',
      );
    }

    // Dev режим: используем моковый ответ для тестирования
    const skipOtpSend = process.env.NEXT_PUBLIC_SKIP_OTP_SEND === 'true';
    const devOtpCode = process.env.NEXT_PUBLIC_DEV_OTP_CODE || '555555';

    if (skipOtpSend) {
      console.info('[DEV MODE] OTP верификация пропущена:', {
        contact: normalizedContact,
        method: data.method,
        otp: data.otp,
        devOtpCode,
      });

      // В dev режиме принимаем любой OTP или специальный dev код
      if (data.otp === devOtpCode || skipOtpSend) {
        // Возвращаем моковый успешный ответ
        // В реальном приложении здесь должен быть моковый токен и пользователь
        // В dev режиме просто возвращаем минимальные данные для прохождения авторизации
        return {
          user: {
            _id: 'dev-mock-user-id',
            email: data.method === 'email' ? normalizedContact : undefined,
          } as Partial<User>,
          token: 'dev-mock-token',
          // refreshToken is in httpOnly cookie, not in response
        };
      }
    }

    const response = await apiClient.post<RawAuthResponse>(this.endpoints.verifyOtp, {
      ...data,
      contact: normalizedContact,
    });

    // Backend возвращает: { data: { accesstoken }, user: {...} }
    // Нужно правильно извлечь данные
    // API может вернуть либо { data: {...} }, либо напрямую {...}
    let responseData: RawAuthResponse;
    if ('data' in response && response.data) {
      // Если есть data, объединяем data и верхнеуровневые поля (user может быть на верхнем уровне)
      const rawResponse = response as unknown as { data?: RawAuthResponse; user?: Partial<User> };
      responseData = {
        ...rawResponse.data,
        user: rawResponse.user ?? rawResponse.data?.user,
      } as RawAuthResponse;
    } else {
      // Если response сам является RawAuthResponse (нестандартный формат от бэкенда)
      responseData = response as unknown as RawAuthResponse;
    }
    return this.normalizeAuthResponse(responseData);
  }

  /**
   * Повторная отправка OTP кода
   * Нормализует контакт перед отправкой
   *
   * В dev режиме (NEXT_PUBLIC_SKIP_OTP_SEND=true) пропускает реальную отправку
   */
  async resendOtp(data: SendOtpRequest): Promise<SendOtpResponse> {
    // Нормализуем контакт в сервисе (бизнес-логика)
    const normalizedContact = normalizeContact(data.contact, data.method);
    if (!normalizedContact) {
      throw new Error(
        data.method === 'phone'
          ? 'Неверный формат номера телефона'
          : 'Неверный формат email адреса',
      );
    }

    // Dev режим: пропускаем реальную отправку для тестирования
    const skipOtpSend = process.env.NEXT_PUBLIC_SKIP_OTP_SEND === 'true';
    if (skipOtpSend) {
      console.info('[DEV MODE] OTP повторная отправка пропущена:', {
        contact: normalizedContact,
        method: data.method,
      });
      return {
        message: 'Код отправлен повторно (dev режим)',
        success: true,
      };
    }

    const response = await apiClient.post<RawSendOtpResponse>(this.endpoints.resendOtp, {
      ...data,
      contact: normalizedContact,
    });
    // API может вернуть либо { data: {...} }, либо напрямую {...}
    // Извлекаем данные из ответа
    // Тип ApiResponse<T> имеет структуру { data?: T; message?: string; ... }
    // Но бэкенд может вернуть данные напрямую без обертки ApiResponse
    let responseData: RawSendOtpResponse;
    if ('data' in response && response.data) {
      responseData = response.data;
    } else {
      // Если response сам является RawSendOtpResponse (нестандартный формат от бэкенда)
      // Используем as unknown as для безопасного приведения типа
      responseData = response as unknown as RawSendOtpResponse;
    }
    return {
      message: responseData?.message ?? 'Код отправлен повторно',
      success: responseData?.success ?? true,
    };
  }

  // ============================================================
  /**
   * Logout user - terminates session on backend
   *
   * CRITICAL:
   * - Backend clears httpOnly cookies (accessToken, refreshToken)
   * - Backend invalidates refresh token in DB
   * - Frontend clears Zustand state after successful logout
   * - Uses POST method (not GET) for security
   * - credentials: 'include' is set automatically by apiClient
   *
   * @param token - Access token (optional, sent in Authorization header)
   */
  async logout(): Promise<void> {
    // CRITICAL: Use POST (not GET) for logout
    // GET requests can be cached, prefetched, or logged in browser history
    // POST ensures logout is intentional and not triggered accidentally
    // CRITICAL: Cookie-only approach - backend reads token from httpOnly cookie
    // No token parameter needed - backend extracts from cookie via auth middleware
    await apiClient.post<void>(
      this.endpoints.logout,
      {}, // Empty body for POST
    );
  }

  /**
   * Refresh access token
   * CRITICAL: refreshToken is read from httpOnly cookie by backend, NOT from request body
   * Frontend sends POST with credentials: 'include' and backend reads cookie automatically
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    // Backend reads refreshToken from httpOnly cookie (credentials: 'include' in apiClient)
    // We do NOT send refreshToken in request body for security
    const response = await apiClient.post<RawAuthResponse>(this.endpoints.refresh, {});
    // API может вернуть либо { data: {...} }, либо напрямую {...}
    // Извлекаем данные из ответа
    let responseData: RawAuthResponse;
    if ('data' in response && response.data) {
      responseData = response.data;
    } else {
      // Если response сам является RawAuthResponse (нестандартный формат)
      responseData = response as unknown as RawAuthResponse;
    }
    return this.normalizeRefreshResponse(responseData);
  }
}

export const authService = new AuthService();
