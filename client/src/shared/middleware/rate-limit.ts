import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, type RateLimitConfig } from '@/shared/lib/rate-limiter';
import { logger } from '@/shared/lib/logger';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Создает rate limiter для middleware
 */
function createLimiter(config: RateLimitConfig): Ratelimit | null {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    // Логируем только в production для мониторинга
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Rate limiting disabled: Redis not configured', {
        limit: config.limit,
        window: config.window,
      });
    }
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
 * Middleware для применения rate limiting к API routes
 * @param request - Next.js request object
 * @param config - Конфигурация rate limiting
 * @returns NextResponse с ошибкой 429 если лимит превышен, или null если запрос разрешен
 */
export async function applyRateLimit(
  request: Request,
  config: RateLimitConfig,
): Promise<NextResponse | null> {
  const limiter = createLimiter(config);
  const identifier = getClientIP(request);

  const result = await checkRateLimit(limiter, identifier);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: true,
        message: 'Превышен лимит запросов. Попробуйте позже.',
        retryAfter: result.reset ? Math.ceil((result.reset - Date.now()) / 1000) : 60,
      },
      {
        status: 429,
        headers: {
          'Retry-After': result.reset
            ? String(Math.ceil((result.reset - Date.now()) / 1000))
            : '60',
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': String(result.remaining || 0),
          'X-RateLimit-Reset': result.reset ? String(result.reset) : '',
        },
      },
    );
  }

  return null;
}
