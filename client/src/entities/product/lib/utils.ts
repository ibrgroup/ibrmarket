import type { Product } from '../model/types';

/**
 * Получает первое доступное изображение продукта
 * @param product - Продукт для получения изображения
 * @returns URL изображения или placeholder
 */
export function getProductImage(product: Product): string {
  const lists = [
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.bannerimages) ? product.bannerimages : []),
  ];
  if (lists.length === 0) {
    return '/placeholder.png';
  }

  for (const img of lists) {
    if (typeof img === 'string') {
      const src = img.trim();
      if (src && src !== '/placeholder.png') {
        return src;
      }
    }

    if (img && typeof img === 'object' && 'url' in img) {
      const url = (img as { url?: unknown }).url;
      if (typeof url === 'string') {
        const src = url.trim();
        if (src && src !== '/placeholder.png') {
          return src;
        }
      }
    }
  }

  return '/placeholder.png';
}

/**
 * Проверяет наличие продукта на складе
 * @param product - Продукт для проверки
 * @returns true если продукт в наличии
 */
export function isProductInStock(product: Product): boolean {
  if (typeof product.countInStock === 'number') {
    return product.countInStock > 0;
  }
  // If countInStock is undefined/null assume available (keep previous optimistic default)
  if (product.countInStock === undefined || product.countInStock === null) {
    return true;
  }
  return Boolean(product.countInStock);
}

/**
 * Форматирует цену продукта для отображения
 * @param price - Цена продукта
 * @param locale - Локаль для форматирования (по умолчанию 'ru-RU')
 * @returns Отформатированная цена со знаком валюты
 */
export function formatProductPrice(price: number | string, locale: string = 'ru-RU'): string {
  const priceNumber = typeof price === 'number' ? price : Number.parseFloat(String(price));

  if (Number.isNaN(priceNumber)) {
    return '0 ₽';
  }

  return `${priceNumber.toLocaleString(locale)} ₽`;
}

/**
 * Вычисляет процент скидки
 * @param oldPrice - Старая цена
 * @param newPrice - Новая цена
 * @returns Процент скидки (округленный)
 */
export function calculateDiscountPercent(oldPrice: number, newPrice: number): number {
  if (oldPrice <= 0 || newPrice >= oldPrice) {
    return 0;
  }
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

/**
 * Проверяет наличие скидки у продукта
 * @param product - Продукт для проверки
 * @returns true если у продукта есть скидка
 */
export function hasDiscount(product: Product): boolean {
  return (
    typeof product.discount === 'number' &&
    product.discount > 0 &&
    typeof product.oldPrice === 'number' &&
    product.oldPrice > product.price
  );
}
