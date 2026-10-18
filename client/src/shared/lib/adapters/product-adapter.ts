// import type { Product } from '@/entities/product';
import { Product } from '@/entities';
import type { CartItem } from '@/entities/cart';
import type { WishlistItem } from '@/entities/wishlist';

/**
 * Адаптер для преобразования данных между различными форматами
 */

// Парсинг цены из строки в число
const parsePrice = (priceStr: string | undefined): number => {
  if (!priceStr) return 0;
  return Number(priceStr.replace(/[^\d]/g, '')) || 0;
};

// Парсинг скидки из строки в число
const parseDiscount = (discountStr: string | undefined): number => {
  if (!discountStr) return 0;
  return Number(discountStr.replace(/[^\d]/g, '')) || 0;
};

/**
 * Преобразует mock Product в формат API Product
 */
export const mockProductToApiProduct = (mockProduct: Product) => {
  const price = parsePrice(mockProduct.price.toString());
  const oldPrice = parsePrice(mockProduct.oldPrice?.toString());
  const discount = parseDiscount(mockProduct.discount.toString());

  return {
    _id: mockProduct._id,
    name: mockProduct.name,
    description: mockProduct.description,
    images: mockProduct.images,
    brand: mockProduct.brand,
    price: price,
    oldPrice: oldPrice,
    catName: mockProduct.catName || mockProduct.category,
    catId: mockProduct.catId,
    subCatId: mockProduct.subCatId,
    subCat: mockProduct.subCat,
    thirdsubCat: mockProduct.thirdsubCat,
    thirdsubCatId: mockProduct.thirdsubCatId,
    category: mockProduct.category,
    countInStock: mockProduct.countInStock,
    rating: mockProduct.rating,
    isFeatured: mockProduct.isFeatured,
    discount: discount,
    sale: mockProduct.sale,
    productRam: mockProduct.productRam,
    size: mockProduct.size,
    productWeight: mockProduct.productWeight || [],
    bannerimages: mockProduct.bannerimages || [],
    bannerTitleName: mockProduct.bannerTitleName,
    isDisplayOnHomeBanner: mockProduct.isDisplayOnHomeBanner,
    reviewCount: mockProduct.reviewCount || 0,
    specifications: mockProduct.specifications || {},
    inStock: mockProduct.inStock || 0,
    createdAt: mockProduct.createdAt,
    updatedAt: mockProduct.updatedAt,
  };
};

/**
 * @deprecated Используйте productToCartItem из '@/entities/cart'
 * Re-export для обратной совместимости
 */
export { productToCartItem } from '@/entities/cart';

/**
 * @deprecated Используйте productToWishlistItem из '@/entities/wishlist'
 * Re-export для обратной совместимости
 */
export { productToWishlistItem } from '@/entities/wishlist';

/**
 * Преобразует API Product в CartItem
 */
export const apiProductToCartItem = (
  product: Product,
  quantity = 1,
): Omit<CartItem, '_id' | 'subTotal'> => {
  return {
    productId: product._id,
    productTitle: product.name,
    name: product.name,
    price: product.price,
    quantity,
    isSelected: true,
    image: product.images && product.images.length > 0 ? product.images[0] : '',
    size: undefined,
    weight: undefined,
    ram: undefined,
    ...(product.brand && { brand: product.brand }),
    ...(product.oldPrice && { oldPrice: product.oldPrice }),
    ...(product.discount !== undefined && { discount: product.discount }),
    ...(product.rating && { rating: product.rating }),
  };
};

/**
 * Преобразует API Product в WishlistItem
 */
export const apiProductToWishlistItem = (product: Product): Omit<WishlistItem, '_id'> => {
  return {
    productId: product._id,
    name: product.name,
    price: product.price || 0,
    image: product.images && product.images.length > 0 ? product.images[0] : '',
    brand: product.brand || '', // Обязательное поле
    oldPrice: product.oldPrice || product.price || 0, // Обязательное поле
    discount: product.discount !== undefined ? product.discount : 0, // Обязательное поле
    rating: product.rating || 0, // Обязательное поле
  };
};

/**
 * @deprecated Используйте serverProductToProduct из '@/entities/product'
 * Re-export для обратной совместимости
 */
export { serverProductToProduct } from '@/entities/product';

/**
 * @deprecated Используйте createCartItem из '@/entities/cart'
 * Re-export для обратной совместимости
 */
export { createCartItem } from '@/entities/cart';

/**
 * @deprecated Используйте createWishlistItem из '@/entities/wishlist'
 * Re-export для обратной совместимости
 */
export { createWishlistItem } from '@/entities/wishlist';
