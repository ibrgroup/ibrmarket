import type { Product } from '@/entities/product';
import type { WishlistItem } from '../model/types';
import { getProductImage } from '@/entities/product/lib/utils';

/**
 * Адаптеры для преобразования Product в WishlistItem
 */

/**
 * Преобразует Product в WishlistItem для добавления в избранное
 */
export function productToWishlistItem(product: Product): Omit<WishlistItem, '_id'> {
  const image = getProductImage(product);

  return {
    productId: product._id,
    name: product.name,
    productTitle: product.name, // Бэкенд ожидает productTitle
    price: product.price,
    image,
    brand: product.brand || '', // Обязательное поле
    oldPrice: product.oldPrice || product.price, // Обязательное поле
    discount: product.discount !== undefined ? product.discount : 0, // Обязательное поле
    rating: product.rating || 0, // Обязательное поле
  };
}

/**
 * Преобразует API Product в WishlistItem
 */
export function apiProductToWishlistItem(product: Product): Omit<WishlistItem, '_id'> {
  return {
    productId: product._id,
    name: product.name,
    productTitle: product.name, // Бэкенд ожидает productTitle
    price: product.price || 0,
    image: product.images && product.images.length > 0 ? product.images[0] : '',
    brand: product.brand || '', // Обязательное поле
    oldPrice: product.oldPrice || product.price || 0, // Обязательное поле
    discount: product.discount !== undefined ? product.discount : 0, // Обязательное поле
    rating: product.rating || 0, // Обязательное поле
  };
}

/**
 * Создает WishlistItem с _id из базовых данных
 */
export function createWishlistItem(baseItem: Omit<WishlistItem, '_id'>, _id: string): WishlistItem {
  return {
    ...baseItem,
    _id,
    // Required fields from WishlistItem type
    productId: baseItem.productId,
    name: baseItem.name || baseItem.productTitle || '',
    productTitle: baseItem.productTitle || baseItem.name || '',
    price: baseItem.price,
    image: baseItem.image || '',
    brand: baseItem.brand || '',
    oldPrice: baseItem.oldPrice || baseItem.price || 0,
    discount: baseItem.discount !== undefined ? baseItem.discount : 0,
    rating: baseItem.rating || 0,
  };
}
