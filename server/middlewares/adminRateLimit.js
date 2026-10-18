import rateLimit from 'express-rate-limit';

/**
 * Stricter limit for /api/admin/* (read + export bursts).
 */
export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, success: false, message: 'Too many admin requests, try again shortly' },
});
