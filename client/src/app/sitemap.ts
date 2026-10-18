{/* deploy fix */}
import { ProductService } from '@/shared/api/services/product-service';
import { getBaseUrl } from '@/shared/config/site';
import type { MetadataRoute } from 'next';

const BASE_URL = getBaseUrl();

/** Статические маршруты с приоритетом и частотой обновления */
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
  {
    url: `${BASE_URL}/products`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  },
  { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/cart`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  {
    url: `${BASE_URL}/contacts`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  { url: `${BASE_URL}/help`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  {
    url: `${BASE_URL}/delivery`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
];

/** Максимум страниц продуктов для одной выборки (чтобы не перегружать API при сборке) */
const PRODUCTS_SITEMAP_LIMIT = 2000;

/** Не блокировать сборку, если API недоступен или отвечает слишком долго */
const PRODUCTS_FETCH_TIMEOUT_MS = 8_000;

/**
 * Собирает ID товаров из API для sitemap.
 * При ошибке API или таймауте возвращает пустой массив — остаются статические URL.
 */
async function getProductIds(): Promise<string[]> {
  const fetchIds = async (): Promise<string[]> => {
    const response = await ProductService.getProducts({
      page: 1,
      limit: PRODUCTS_SITEMAP_LIMIT,
    });

    const raw = response?.data ?? response;
    const list = Array.isArray(raw) ? raw : (raw?.products ?? raw?.data ?? []);
    if (!Array.isArray(list)) return [];

    return list
      .map((item: { _id?: string; product?: { _id?: string } }) => item?._id ?? item?.product?._id)
      .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);
  };

  try {
    return await Promise.race([
      fetchIds().catch(() => []),
      new Promise<string[]>((resolve) => setTimeout(() => resolve([]), PRODUCTS_FETCH_TIMEOUT_MS)),
    ]);
  } catch {
    return [];
  }
}

/**
 * Генерирует sitemap.xml для поисковых систем.
 * Включает главную, каталог, инфо-страницы и страницы товаров (из API).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productIds = await getProductIds();
  const productEntries: MetadataRoute.Sitemap = productIds.map((id) => ({
    url: `${BASE_URL}/product/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...STATIC_ROUTES, ...productEntries];
}
