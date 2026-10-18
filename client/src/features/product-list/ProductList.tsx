'use client';

import type { Product } from '@/entities';
import {
  cartLineMatchesProductCatalogDefault,
  productToCartItem,
  useCartStore,
} from '@/entities/cart';
import { ProductCard } from '@/entities/product';
import { productToWishlistItem, useWishlistStore } from '@/entities/wishlist';
import { useRouter } from 'next/navigation';
import React, { useCallback } from 'react';
import { toast } from 'sonner';

export interface ProductListProps {
  products: Product[] | { products: Product[]; total?: number; totalPages?: number };
  className?: string;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isInWishlist?: (id: string) => boolean;
  isInCart?: (product: Product) => boolean;
  onCartClick?: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  className,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
  isInCart,
  onCartClick,
}) => {
  // Handle both direct array and response object with products property
  const productArray = Array.isArray(products) ? products : products?.products || [];

  const { addItem: addToCart, items: cartItems } = useCartStore();
  const {
    addItem: addToWishlist,
    isInWishlist: storeIsInWishlist,
    removeItemByProductId: removeFromWishlist,
  } = useWishlistStore();
  const router = useRouter();

  const handleAddToCart = useCallback(
    (product: Product) => {
      // Проверка наличия товара
      let countInStock = true;
      if (typeof product.countInStock === 'number') {
        countInStock = product.countInStock > 0;
      } else {
        countInStock = !('countInStock' in product) || !!product.countInStock;
      }

      if (!countInStock) {
        toast.error('Товара нет в наличии');
        return;
      }
      if (cartItems.some((item) => cartLineMatchesProductCatalogDefault(item, product))) {
        return;
      }

      const cartItem = productToCartItem(product, 1);
      addToCart(cartItem);
    },
    [addToCart, cartItems],
  );

  const handleToggleWishlist = useCallback(
    (product: Product) => {
      if (storeIsInWishlist(product._id)) {
        removeFromWishlist(product._id);
      } else {
        const wishlistItem = productToWishlistItem(product);
        addToWishlist(wishlistItem);
      }
    },
    [addToWishlist, removeFromWishlist, storeIsInWishlist],
  );

  const fallbackIsInCart = useCallback(
    (p: Product) => cartItems.some((item) => cartLineMatchesProductCatalogDefault(item, p)),
    [cartItems],
  );

  const fallbackCartClick = useCallback(() => {
    router.push('/cart');
  }, [router]);

  if (!productArray || productArray.length === 0) {
    return (
      <div
        className={`max-container m-auto mt-10 mb-10 flex flex-wrap justify-center gap-6 ${
          className || ''
        }`}
      >
        <p className="w-full py-8 text-center text-gray-400">Нет товаров</p>
      </div>
    );
  }

  return (
    <div
      className={`mt-6 grid grid-cols-2 gap-0.5 md:gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 ${className || ''}`}
    >
      {productArray.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onAddToCart={onAddToCart || handleAddToCart}
          onToggleWishlist={onToggleWishlist || handleToggleWishlist}
          isInWishlist={isInWishlist || storeIsInWishlist}
          isInCart={isInCart || fallbackIsInCart}
          onCartClick={onCartClick || fallbackCartClick}
        />
      ))}
    </div>
  );
};

export default ProductList;
