/**
 * Константы для компонента быстрого просмотра товара
 */

export const ROUTES = {
  CART: '/cart',
  CHECKOUT: '/checkout',
  PRODUCT: (id: string) => `/product/${id}`,
} as const;

export const RETURN_POLICY_DAYS = 14;

export const STOCK_THRESHOLDS = {
  HIGH: 10,
  LOW: 0,
} as const;

export const GALLERY_CONFIG = {
  VISIBLE_IMAGES_COUNT: 3, // Текущее + соседние для плавности
} as const;
