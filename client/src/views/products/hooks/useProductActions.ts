'use client';

import type { Product } from '@/entities';
import {
  cartLineMatchesProductCatalogDefault,
  productToCartItem,
  useCartStore,
} from '@/entities/cart';
import { getProductImage, isProductInStock } from '@/entities/product/lib/utils';
import { useWishlistStore } from '@/entities/wishlist';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Хук для действий с продуктами (добавление в корзину, wishlist)
 */
export function useProductActions() {
  const { addItem, items: cartItems } = useCartStore();
  const {
    addItem: addToWishlist,
    isInWishlist,
    removeItemByProductId: removeFromWishlist,
  } = useWishlistStore();
  const router = useRouter();

  const handleAddToCart = useCallback(
    (product: Product) => {
      const image = getProductImage(product);
      if (!image || image === '/placeholder.png') {
        toast.error('Ошибка: отсутствует изображение товара');
        return;
      }
      if (!isProductInStock(product)) {
        toast.error('Товара нет в наличии');
        return;
      }
      if (cartItems.some((item) => cartLineMatchesProductCatalogDefault(item, product))) {
        return;
      }
      addItem(productToCartItem(product, 1));
    },
    [addItem, cartItems],
  );

  const handleToggleWishlist = useCallback(
    async (product: Product) => {
      const image = getProductImage(product);
      if (!image || image === '/placeholder.png') {
        toast.error('Ошибка: отсутствует изображение товара');
        return;
      }
      if (isInWishlist(product._id)) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist({
          productId: product._id,
          name: product.name,
          productTitle: product.name,
          image,
          price: product.price,
          oldPrice: typeof product.oldPrice === 'number' ? product.oldPrice : product.price,
          discount: typeof product.discount === 'number' ? product.discount : 0,
          brand: product.brand || '',
          rating: typeof product.rating === 'number' ? product.rating : 0,
        });
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist],
  );

  const isInCart = useCallback(
    (p: Product) => cartItems.some((item) => cartLineMatchesProductCatalogDefault(item, p)),
    [cartItems],
  );

  const handleCartClick = useCallback(() => {
    router.push('/cart');
  }, [router]);

  return {
    handleAddToCart,
    handleToggleWishlist,
    isInWishlist,
    isInCart,
    handleCartClick,
  };
}
