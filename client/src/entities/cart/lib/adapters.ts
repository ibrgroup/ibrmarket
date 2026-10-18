import type { Product } from '@/entities/product';
import { defaultCatalogCartVariantFields } from '@/entities/product/lib/catalog-cart-variant';
import { getProductImage } from '@/entities/product/lib/utils';
import type { CartItem } from '../model/types';

/**
 * Адаптеры для преобразования Product в CartItem
 */

/**
 * Преобразует Product в CartItem для добавления в корзину
 */
export function productToCartItem(
  product: Product,
  quantity = 1,
): Omit<CartItem, '_id' | 'subTotal'> {
  const image = getProductImage(product);
  const v = defaultCatalogCartVariantFields(product);

  return {
    productId: product._id,
    name: product.name,
    productTitle: product.name, // Бэкенд ожидает productTitle
    price: product.price,
    quantity,
    isSelected: true,
    image,
    ...(v.size ? { size: v.size } : {}),
    ...(v.color ? { color: v.color } : {}),
    ...(product.brand && { brand: product.brand }),
    ...(product.oldPrice && { oldPrice: product.oldPrice }),
    ...(product.discount !== undefined && { discount: product.discount }),
    ...(product.countInStock && { countInStock: product.countInStock }),
    ...(product.rating && { rating: product.rating }),
  };
}

/**
 * Преобразует API Product в CartItem
 */
export function apiProductToCartItem(
  product: Product,
  quantity = 1,
): Omit<CartItem, '_id' | 'subTotal'> {
  const v = defaultCatalogCartVariantFields(product);
  return {
    productId: product._id,
    productTitle: product.name,
    name: product.name,
    price: product.price,
    quantity,
    isSelected: true,
    image: product.images && product.images.length > 0 ? product.images[0] : '',
    ...(v.size ? { size: v.size } : {}),
    ...(v.color ? { color: v.color } : {}),
    ...(product.brand && { brand: product.brand }),
    ...(product.oldPrice && { oldPrice: product.oldPrice }),
    ...(product.discount !== undefined && { discount: product.discount }),
    ...(product.rating && { rating: product.rating }),
  };
}

/**
 * Создает CartItem с _id и subTotal из базовых данных
 */
export function createCartItem(
  baseItem: Omit<CartItem, '_id' | 'subTotal'>,
  _id: string,
): CartItem {
  return {
    ...baseItem,
    _id,
    subTotal: baseItem.price * baseItem.quantity,
    // Required fields from CartItem type
    productId: baseItem.productId,
    name: baseItem.name,
    price: baseItem.price,
    quantity: baseItem.quantity,
    isSelected: baseItem.isSelected ?? false,
  };
}
