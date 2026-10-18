/**
 * Конфигурация сайта для SEO, canonical URL и метаданных.
 * Используется в layout, sitemap, robots и generateMetadata.
 */

export const SITE_NAME = 'Для ваших покупок ';
export const SITE_DESCRIPTION =
  'IBR Market — маркетплейс с широким ассортиментом товаров. Удобная доставка, выгодные цены, отзывы покупателей. Покупайте с уверенностью.';

/** Краткое описание для OG (до ~160 символов) */
export const SITE_DESCRIPTION_SHORT =
  'Маркетплейс IBR Market: широкий ассортимент, доставка, выгодные цены. Покупайте с уверенностью.';

/**
 * Базовый URL сайта (без trailing slash).
 * В production обязательно задать NEXT_PUBLIC_SITE_URL.
 */
export function getBaseUrl(): string {
  if (typeof process.env.NEXT_PUBLIC_SITE_URL === 'string' && process.env.NEXT_PUBLIC_SITE_URL.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/+$/, '');
  }
  if (typeof process.env.VERCEL_URL === 'string' && process.env.VERCEL_URL.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }
  return 'https://ibrmarket.com';
}

/** Язык по умолчанию для метаданных и schema */
export const DEFAULT_LOCALE = 'ru';
