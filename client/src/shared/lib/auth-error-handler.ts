import { AuthError } from './auth';
import { devLog } from './logger';

/**
 * Типы ошибок аутентификации
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  OTP_INVALID = 'OTP_INVALID',
  OTP_EXPIRED = 'OTP_EXPIRED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Стандартизированный формат ошибки аутентификации
 */
export interface AuthErrorResponse {
  type: AuthErrorType;
  message: string;
  statusCode: number;
  originalError?: unknown;
}

/**
 * Извлекает тип ошибки из HTTP статуса
 */
function getErrorTypeFromStatus(statusCode: number): AuthErrorType {
  switch (statusCode) {
    case 401:
      return AuthErrorType.UNAUTHORIZED;
    case 403:
      return AuthErrorType.UNAUTHORIZED;
    case 429:
      return AuthErrorType.RATE_LIMIT;
    case 500:
    case 502:
    case 503:
    case 504:
      return AuthErrorType.SERVER_ERROR;
    default:
      return AuthErrorType.UNKNOWN;
  }
}

/**
 * Извлекает сообщение об ошибке из различных форматов ответа API
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Проверяем специфичные сообщения об ошибках
    const message = error.message.toLowerCase();
    if (message.includes('otp') && (message.includes('invalid') || message.includes('неверный'))) {
      return 'Неверный код подтверждения';
    }
    if (message.includes('otp') && (message.includes('expired') || message.includes('истек'))) {
      return 'Код подтверждения истек';
    }
    if (message.includes('token') && (message.includes('expired') || message.includes('истек'))) {
      return 'Сессия истекла. Пожалуйста, войдите снова';
    }
    if (message.includes('unauthorized') || message.includes('не авторизован')) {
      return 'Необходима авторизация';
    }
    if (message.includes('rate limit') || message.includes('слишком много')) {
      return 'Слишком много запросов. Пожалуйста, подождите';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Ошибка сети. Проверьте подключение к интернету';
    }
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    // Проверяем стандартные поля ответа API
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
  }

  return 'Произошла неизвестная ошибка';
}

/**
 * Извлекает статус код из ошибки
 */
function extractStatusCode(error: unknown): number {
  if (error instanceof AuthError) {
    return error.statusCode;
  }

  if (error && typeof error === 'object') {
    if ('status' in error && typeof error.status === 'number') {
      return error.status;
    }
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return error.statusCode;
    }
    // Проверяем сообщение на наличие статус кода
    if ('message' in error && typeof error.message === 'string') {
      const match = error.message.match(/status[:\s]+(\d+)/i);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
  }

  return 500; // По умолчанию
}

/**
 * Централизованный обработчик ошибок аутентификации
 * Преобразует различные форматы ошибок в стандартизированный формат
 */
export function handleAuthError(error: unknown): AuthErrorResponse {
  const statusCode = extractStatusCode(error);
  const message = extractErrorMessage(error);
  const errorType = getErrorTypeFromStatus(statusCode);

  // Логируем ошибку только в development режиме
  devLog.error('[AuthErrorHandler] Authentication error:', {
    type: errorType,
    message,
    statusCode,
    originalError: error instanceof Error ? error.stack : error,
  });

  return {
    type: errorType,
    message,
    statusCode,
    originalError: error,
  };
}

/**
 * Создает стандартизированную ошибку аутентификации
 */
export function createAuthError(message: string, statusCode: number = 401): AuthError {
  return new AuthError(message, statusCode);
}

/**
 * Проверяет, является ли ошибка ошибкой аутентификации
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
