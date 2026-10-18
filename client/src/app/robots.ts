{/* deploy fix */}
import { getBaseUrl } from '@/shared/config/site';
import type { MetadataRoute } from 'next';

/**
 * Генерирует robots.txt для поисковых роботов.
 * Разрешает индексацию всего сайта и указывает на sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/checkout/',
          '/my-account/',
          '/my-orders/',
          '/payment/',
          '/settings/',
          '/login',
          '/_next/',
          '/admin',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/checkout/',
          '/my-account/',
          '/my-orders/',
          '/payment/',
          '/settings/',
          '/login',
          '/_next/',
          '/admin',
        ],
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow: [
          '/api/',
          '/checkout/',
          '/my-account/',
          '/my-orders/',
          '/payment/',
          '/settings/',
          '/login',
          '/_next/',
          '/admin',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
