import {
  cartLineMatchesProductCatalogDefault,
  productToCartItem,
  useCartStore,
} from '@/entities/cart';
import { useWishlistStore } from '@/entities/wishlist';
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Product } from '../model/types';

/** Действия для карточек в каруселях «похожие / популярное / рекомендации». */
export function useProductRailActions() {
  const { addItem } = useCartStore();
  const cartItems = useCartStore((s) => s.items);
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isInWishlist,
  } = useWishlistStore();

  const onAddToCart = useCallback(
    async (p: Product) => {
      await addItem(productToCartItem(p, 1));
      toast.success('Товар добавлен в корзину');
    },
    [addItem],
  );

  const onToggleWishlist = useCallback(
    async (p: Product) => {
      try {
        if (isInWishlist(p._id)) {
          const witem = useWishlistStore.getState().items.find((i) => i.productId === p._id);
          if (witem) await removeFromWishlist(witem._id);
          toast.success('Удалено из избранного');
        } else {
          const rawImg = p.images?.[0];
          await addToWishlist({
            productId: p._id,
            name: p.name,
            productTitle: p.name,
            image: typeof rawImg === 'string' ? rawImg : '/placeholder.png',
            price: p.price,
            oldPrice: p.oldPrice ?? p.price,
            discount: p.discount ?? 0,
            brand: p.brand ?? '',
            rating: p.rating ?? 0,
          });
          toast.success('Добавлено в избранное');
        }
      } catch {
        toast.error('Не удалось обновить избранное');
      }
    },
    [isInWishlist, removeFromWishlist, addToWishlist],
  );

  const isInCart = useCallback(
    (p: Product) => cartItems.some((i) => cartLineMatchesProductCatalogDefault(i, p)),
    [cartItems],
  );

  return { onAddToCart, onToggleWishlist, isInWishlist, isInCart };
}
