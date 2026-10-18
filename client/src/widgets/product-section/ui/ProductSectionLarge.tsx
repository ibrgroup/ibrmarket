'use client';

import { Product } from '@/entities';
import {
  cartLineMatchesProductCatalogDefault,
  productToCartItem,
  useCartStore,
} from '@/entities/cart';
import { ProductCard } from '@/entities/product';
import { productToWishlistItem, useWishlistStore } from '@/entities/wishlist';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface ProductSectionLargeProps {
  products: Product[];
  title?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export const ProductSectionLarge = ({
  products,
  title = '',
  showViewAll = true,
  onViewAll,
}: ProductSectionLargeProps) => {
  const { addItem: addToCart, items: cartItems } = useCartStore();
  const {
    addItem: addToWishlist,
    isInWishlist,
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
      // Получение изображения продукта
      // Удаление получения изображения продукта, так как переменная image не используется
      // let image: string | undefined;
      // if (Array.isArray(product.images) && product.images.length > 0) {
      //   const img = product.images.find(
      //     (i) =>
      //       (typeof i === 'string' && i.trim() && i !== '/placeholder.png') ||
      //       (typeof i === 'object' &&
      //         i &&
      //         'url' in i &&
      //         typeof (i as { url?: unknown }).url === 'string' &&
      //         (i as { url: string }).url.trim() &&
      //         (i as { url: string }).url !== '/placeholder.png'),
      //   );
      //   if (typeof img === 'string') {
      //     image = img;
      //   } else if (
      //     img &&
      //     typeof img === 'object' &&
      //     'url' in img &&
      //     typeof (img as { url?: unknown }).url === 'string' &&
      //     (img as { url: string }).url.trim()
      //   ) {
      //     image = (img as { url: string }).url;
      //   }
      // }

      if (isInWishlist(product._id)) {
        removeFromWishlist(product._id);
      } else {
        const wishlistItem = productToWishlistItem(product);
        addToWishlist(wishlistItem);
      }
    },
    [addToWishlist, isInWishlist, removeFromWishlist],
  );

  const isInCart = useCallback(
    (p: Product) => cartItems.some((item) => cartLineMatchesProductCatalogDefault(item, p)),
    [cartItems],
  );

  const handleCartClick = useCallback(() => {
    router.push('/cart');
  }, [router]);

  return (
    <section className="w-full">
      {(title || showViewAll) && (
        <div className="mb-6 flex items-center justify-between">
          {title && <h2 className="text-foreground text-2xl font-bold">{title}</h2>}
          {showViewAll && onViewAll && (
            <button
              onClick={onViewAll}
              className="border-indigo-500 text-indigo-500 hover:bg-indigo-500/10 focus-visible:ring-indigo-500/30 inline-flex items-center gap-2 rounded-full bg-transparent px-4 py-2 text-sm font-semibold shadow transition-colors hover:underline focus:outline-none focus-visible:ring-2"
            >
              <span>Смотреть все</span>
            </button>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            isInWishlist={isInWishlist}
            isInCart={isInCart}
            onCartClick={handleCartClick}
          />
        ))}
      </div>
    </section>
  );
};
