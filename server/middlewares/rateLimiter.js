import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter для OTP эндпоинтов
 * Защита от спама и брутфорс атак
 *
 * В dev режиме (NODE_ENV !== 'production' или DISABLE_RATE_LIMIT=true) rate limiting отключен
 */

// Проверка: отключен ли rate limiting в dev режиме
const isRateLimitDisabled =
  process.env.NODE_ENV !== 'production' || process.env.DISABLE_RATE_LIMIT === 'true';

// Пустой middleware для dev режима (просто пропускает запрос)
const noopLimiter = (req, res, next) => {
  next();
};

// Логируем один раз при загрузке модуля, если rate limiting отключен
if (isRateLimitDisabled) {
  console.info('[Rate Limit] ⚠️ Rate limiting отключен в dev режиме (NODE_ENV !== "production")');
}

/**
 * Rate limiter для отправки OTP кодов
 * Максимум 5 запросов в 15 минут с одного IP
 * В dev режиме отключен
 */
export const sendOtpLimiter = isRateLimitDisabled
  ? noopLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 минут
      max: 5, // Максимум 5 запросов
      message: {
        message: 'Слишком много попыток отправки кода. Попробуйте позже через 15 минут',
        error: true,
        success: false,
      },
      standardHeaders: true, // Возвращает информацию о лимите в заголовках `RateLimit-*`
      legacyHeaders: false, // Отключает `X-RateLimit-*` заголовки
      // Ключ для идентификации клиента (по IP)
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
      },
      // Пропустить успешные запросы (не учитывать их в лимите)
      skipSuccessfulRequests: false,
      // Пропустить неудачные запросы
      skipFailedRequests: false,
      handler: (req, res) => {
        console.warn(`⚠️ [Rate Limit] Send OTP превышен для IP: ${req.ip}`);
        res.status(429).json({
          message: 'Слишком много попыток отправки кода. Попробуйте позже через 15 минут',
          error: true,
          success: false,
        });
      },
    });

/**
 * Rate limiter для верификации OTP кодов
 * Максимум 10 попыток в 5 минут с одного IP
 * В dev режиме отключен
 */
export const verifyOtpLimiter = isRateLimitDisabled
  ? noopLimiter
  : rateLimit({
      windowMs: 5 * 60 * 1000, // 5 минут
      max: 10, // Максимум 10 попыток
      message: {
        message: 'Слишком много попыток ввода кода. Попробуйте позже через 5 минут',
        error: true,
        success: false,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
      },
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      handler: (req, res) => {
        console.warn(`⚠️ [Rate Limit] Verify OTP превышен для IP: ${req.ip}`);
        res.status(429).json({
          message: 'Слишком много попыток ввода кода. Попробуйте позже через 5 минут',
          error: true,
          success: false,
        });
      },
    });

/**
 * Rate limiter для повторной отправки OTP кодов
 * Более строгий лимит: максимум 3 запроса в 15 минут
 * В dev режиме отключен
 */
export const resendOtpLimiter = isRateLimitDisabled
  ? noopLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 минут
      max: 3, // Максимум 3 запроса
      message: {
        message: 'Слишком много попыток повторной отправки. Попробуйте позже через 15 минут',
        error: true,
        success: false,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
      },
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      handler: (req, res) => {
        console.warn(`⚠️ [Rate Limit] Resend OTP превышен для IP: ${req.ip}`);
        res.status(429).json({
          message: 'Слишком много попыток повторной отправки. Попробуйте позже через 15 минут',
          error: true,
          success: false,
        });
      },
    });

/**
 * Rate limiter для операций с адресами
 * Максимум 20 операций (создание/удаление/обновление) в 15 минут с одного пользователя
 */
export const addressRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20, // Максимум 20 операций
  message: {
    message: 'Слишком много операций с адресами. Попробуйте позже через 15 минут',
    error: true,
    success: false,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Используем userId из request для идентификации пользователя
  keyGenerator: (req) => {
    return req.userId ? `address:${req.userId}` : req.ip || req.connection.remoteAddress;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res) => {
    console.warn(`⚠️ [Rate Limit] Address operations exceeded for user: ${req.userId || req.ip}`);
    res.status(429).json({
      message: 'Слишком много операций с адресами. Попробуйте позже через 15 минут',
      error: true,
      success: false,
    });
  },
});

/**
 * Rate limiter для refresh token endpoint
 * КРИТИЧЕСКИ ВАЖНО для безопасности - защита от:
 * - Brute force атак
 * - DoS атак
 * - Token enumeration
 *
 * Максимум 30 запросов в 15 минут с одного IP
 * Это достаточно для нормального использования (refresh каждые 30 сек максимум)
 * но защищает от злоупотреблений
 */
export const refreshTokenLimiter = isRateLimitDisabled
  ? noopLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 минут
      max: 30, // Максимум 30 запросов (refresh каждые 30 сек = 30 за 15 мин)
      message: {
        message: 'Слишком много попыток обновления токена. Попробуйте позже через 15 минут',
        error: true,
        success: false,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
      },
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      handler: (req, res) => {
        console.warn(`⚠️ [Rate Limit] Refresh token превышен для IP: ${req.ip}`);
        // SECURITY AUDIT: Log potential abuse
        console.warn(`🔒 [Security] Potential token refresh abuse from IP: ${req.ip}`);
        res.status(429).json({
          message: 'Слишком много попыток обновления токена. Попробуйте позже через 15 минут',
          error: true,
          success: false,
        });
      },
    });

/**
 * Общий rate limiter для API
 * Максимум 100 запросов в 15 минут с одного IP
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // Максимум 100 запросов
  message: {
    message: 'Слишком много запросов к API. Попробуйте позже',
    error: true,
    success: false,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
