import type { Product } from '@/entities/product';
import type { IProduct } from '../product-grid/model/types';

/**
 * Берёт первый валидный URL изображения из продукта
 */
function getFirstImage(product: Product): string {
  const images = product.images;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === 'string' && first.trim()) return first;
    if (typeof first === 'object' && first && 'url' in first && typeof (first as { url: string }).url === 'string') {
      return (first as { url: string }).url;
    }
  }
  return '/placeholder.svg';
}

/**
 * Преобразует Product (entity) в IProduct для виджетов главной (HorizontalScrollBanner, ProductGrid).
 * Для ProductGrid можно задать size по индексу: 0 — large, 1 — medium, остальные — small.
 */
export function productToIProduct(
  product: Product,
  options?: { index?: number; size?: IProduct['size']; badge?: string },
): IProduct {
  const index = options?.index ?? 0;
  let size = options?.size;
  if (size === undefined) {
    if (index === 0) size = 'large';
    else if (index === 1) size = 'medium';
    else size = 'small';
  }
  const rating = typeof product.rating === 'number' && !Number.isNaN(product.rating) ? product.rating : 0;
  const reviewCount = typeof product.reviewCount === 'number' && !Number.isNaN(product.reviewCount) ? product.reviewCount : 0;
  return {
    id: product._id,
    image: getFirstImage(product),
    title: product.name || 'Без названия',
    price: product.price ?? 0,
    oldPrice: product.oldPrice,
    rating,
    reviewCount,
    badge: options?.badge ?? (product.discount ? `−${product.discount}%` : undefined),
    size,
  };
}

/**
 * Преобразует массив Product в IProduct[] с авто-размерами для сетки (первый — large, второй — medium, остальные — small).
 */
export function productsToIProducts(products: Product[]): IProduct[] {
  return products.map((p, i) => productToIProduct(p, { index: i }));
}
