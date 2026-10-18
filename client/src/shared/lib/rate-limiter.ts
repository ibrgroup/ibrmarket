import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Конфигурация rate limiting для различных endpoints
 */
export interface RateLimitConfig {
  /**
   * Количество разрешенных запросов
   */
  limit: number;
  /**
   * Временное окно в секундах
   */
  window: number;
}

/**
 * Создает rate limiter с использованием Upstash Redis
 * Если Upstash не настроен, возвращает null (rate limiting отключен)
 */
function createRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Если Upstash не настроен, возвращаем null (rate limiting отключен)
  if (!redisUrl || !redisToken) {
    return null;
  }

  const redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, `${config.window} s`),
    analytics: true,
    prefix: '@ibr-client/ratelimit',
  });
}

/**
 * Получить IP адрес из запроса
 */
export function getClientIP(request: Request): string {
  // Пробуем получить IP из различных заголовков
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback на 'unknown' если IP не найден
  return 'unknown';
}

/**
 * Rate limiter для создания платежа
 * 10 запросов в минуту на IP
 */
export const paymentCreateLimiter = createRateLimiter({
  limit: 10,
  window: 60,
});

/**
 * Rate limiter для webhook
 * 100 запросов в минуту на IP (YooKassa может отправлять много)
 */
export const webhookLimiter = createRateLimiter({
  limit: 100,
  window: 60,
});

/**
 * Rate limiter для сохранения карты
 * 5 запросов в минуту на IP
 */
export const saveCardLimiter = createRateLimiter({
  limit: 5,
  window: 60,
});

/**
 * Проверка rate limit для запроса
 * @param limiter - Rate limiter instance
 * @param identifier - Идентификатор (обычно IP адрес)
 * @returns true если запрос разрешен, false если превышен лимит
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ allowed: boolean; remaining?: number; reset?: number }> {
  // Если rate limiter не настроен, разрешаем все запросы
  if (!limiter) {
    // Логируем только в production для мониторинга
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[Rate Limit] Rate limiting disabled: Redis not configured. All requests allowed.',
      );
    }
    return { allowed: true };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // В случае ошибки Redis, разрешаем запрос (fail-open)
    console.error('Rate limit check failed:', error);
    return { allowed: true };
  }
}
