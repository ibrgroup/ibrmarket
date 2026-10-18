import { cartLinesSameVariant, useCartStore } from '@/entities/cart';
import { CHECKOUT_ONLY_LINE_IDS_SESSION_KEY } from '@/entities/cart/lib/checkout-session-storage';
import type { Product } from '@/entities/product';
import {
  collectProductGallerySlides,
  pickCartImageFromGallery,
} from '@/entities/product/lib/product-gallery';
import { getProductImage } from '@/entities/product/lib/utils';
import { useWishlistStore } from '@/entities/wishlist';
import { ROUTES } from '@/features/product-quick-view/model/constants';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

function normOptions(list?: (string | null)[] | null): string[] {
  if (!Array.isArray(list)) return [];
  return list.map((v) => String(v ?? '').trim()).filter(Boolean);
}

interface UseProductActionsProps {
  product: Product | null;
  productId: string | null;
  selectedSize: string;
  selectedColor: string;
  onClose: () => void;
  onNavigateToCart?: () => void;
}

/**
 * Действия с товаром в quick view: те же поля корзины (размер/цвет), что и на странице товара.
 */
export function useProductActions({
  product,
  productId,
  selectedSize,
  selectedColor,
  onClose,
  onNavigateToCart,
}: UseProductActionsProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const { toggleItem: toggleWishlist } = useWishlistStore();

  const isInWishlist = useWishlistStore((state) =>
    productId ? state.items.some((item) => item.productId === productId) : false,
  );

  const variantKey = useMemo(
    () => ({
      productId: productId ?? '',
      size: selectedSize,
      color: selectedColor,
      weight: '' as const,
      ram: '' as const,
    }),
    [productId, selectedSize, selectedColor],
  );

  const inCart = useMemo(
    () =>
      variantKey.productId ? items.some((item) => cartLinesSameVariant(item, variantKey)) : false,
    [items, variantKey],
  );

  const cartItem = useMemo(
    () =>
      variantKey.productId
        ? (items.find((item) => cartLinesSameVariant(item, variantKey)) ?? null)
        : null,
    [items, variantKey],
  );

  const createCartItemData = useCallback(
    (productData: Product, itemQuantity: number) => {
      const slides = collectProductGallerySlides(productData);
      const imageSrc = pickCartImageFromGallery(slides, 0, getProductImage(productData));
      return {
        productId: productData._id,
        productTitle: productData.name,
        name: productData.name,
        price: productData.price,
        quantity: itemQuantity,
        isSelected: true,
        image: imageSrc,
        brand: productData.brand,
        oldPrice: productData.oldPrice,
        discount: productData.discount,
        rating: productData.rating,
        ...(selectedSize ? { size: selectedSize } : {}),
        ...(selectedColor ? { color: selectedColor } : {}),
      };
    },
    [selectedSize, selectedColor],
  );

  const assertVariantsChosen = useCallback(() => {
    if (!product) return false;
    const sizeOpts = normOptions(product.size);
    const colorOpts = normOptions(product.colors);
    if (sizeOpts.length > 0 && !String(selectedSize).trim()) {
      toast.error('Выберите размер');
      return false;
    }
    if (colorOpts.length > 0 && !String(selectedColor).trim()) {
      toast.error('Выберите цвет');
      return false;
    }
    return true;
  }, [product, selectedSize, selectedColor]);

  const handleAddToCart = useCallback(
    async (quantity: number = 1) => {
      if (!product) return;
      if (!assertVariantsChosen()) return;

      try {
        await addItem(createCartItemData(product, quantity));
        toast.success(`${product.name} добавлен в корзину`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Не удалось добавить товар в корзину';
        toast.error(errorMessage);
        throw error;
      }
    },
    [product, addItem, createCartItemData, assertVariantsChosen],
  );

  const handleGoToCart = useCallback(() => {
    if (onNavigateToCart) {
      onNavigateToCart();
    } else {
      router.push(ROUTES.CART);
      onClose();
    }
  }, [router, onClose, onNavigateToCart]);

  const handleBuyNow = useCallback(
    async (quantity: number = 1) => {
      if (!product) return;
      if (!assertVariantsChosen()) return;

      try {
        await addItem(createCartItemData(product, quantity));
        const { items: cartLines, selectOnlyItem } = useCartStore.getState();
        const line = cartLines.find((item) => cartLinesSameVariant(item, variantKey));
        if (line) {
          selectOnlyItem(line._id);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(CHECKOUT_ONLY_LINE_IDS_SESSION_KEY, JSON.stringify([line._id]));
          }
        }
        router.push(ROUTES.CHECKOUT);
        onClose();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Не удалось оформить заказ';
        toast.error(errorMessage);
        throw error;
      }
    },
    [product, addItem, createCartItemData, router, onClose, assertVariantsChosen, variantKey],
  );

  const handleToggleWishlist = useCallback(async () => {
    if (!product) return;

    try {
      await toggleWishlist(product);
      toast.success(`Товар ${isInWishlist ? 'удален из избранного' : 'добавлен в избранное'}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Не удалось изменить статус избранного';
      toast.error(errorMessage);
    }
  }, [product, isInWishlist, toggleWishlist]);

  const handleCopyArticle = useCallback(async () => {
    if (!productId) return;

    try {
      await navigator.clipboard.writeText(productId);
      toast.success('Артикул скопирован');
    } catch {
      toast.error('Не удалось скопировать артикул');
    }
  }, [productId]);

  return {
    isInWishlist,
    inCart,
    cartItem,
    handleAddToCart,
    handleGoToCart,
    handleBuyNow,
    handleToggleWishlist,
    handleCopyArticle,
  };
}
