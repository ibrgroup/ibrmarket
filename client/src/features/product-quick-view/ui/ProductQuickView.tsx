'use client';

import { selectCartTotalUnits, useCartStore } from '@/entities/cart';
import { useProductById } from '@/entities/product/lib/use-products';
import { useIsMobile } from '@/shared/hooks';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useProductActions } from '../lib/hooks';
import {
  ProductActions,
  ProductGallery,
  ProductHeader,
  ProductMeta,
  ProductPrice,
} from './components';

const QUICK_VIEW_DIALOG_CLASS =
  'bg-card z-[100] flex h-[min(720px,calc(100dvh-2rem))] min-h-[480px] w-[calc(100%-2rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl';

const QUICK_VIEW_OVERLAY_CLASS = 'z-[100] bg-black/60 backdrop-blur-[3px]';

interface ProductQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  onNavigateToCart?: () => void;
}

/**
 * Компонент быстрого просмотра товара
 * Разделен на подкомпоненты для лучшей поддерживаемости и переиспользования
 */
export function ProductQuickView({
  isOpen,
  onClose,
  productId,
  onNavigateToCart,
}: ProductQuickViewProps) {
  const isMobile = useIsMobile();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const totalCartUnits = useCartStore(selectCartTotalUnits);
  const setCartQuantity = useCartStore((s) => s.setQuantity);

  const { data: product, isLoading, isError, refetch } = useProductById(productId || '');

  const sizeOptions = useMemo(
    () => (product?.size || []).map((s) => String(s ?? '').trim()).filter(Boolean),
    [product?.size],
  );
  const colorOptions = useMemo(
    () => (product?.colors || []).map((c) => String(c ?? '').trim()).filter(Boolean),
    [product?.colors],
  );

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    if (!product) return;
    setSelectedSize(sizeOptions[0] ?? '');
    setSelectedColor(colorOptions[0] ?? '');
  }, [product?._id, sizeOptions, colorOptions]);

  const {
    isInWishlist,
    inCart,
    cartItem,
    handleAddToCart: baseHandleAddToCart,
    handleGoToCart,
    handleBuyNow: baseHandleBuyNow,
    handleToggleWishlist,
    handleCopyArticle,
  } = useProductActions({
    product: product ?? null,
    productId,
    selectedSize,
    selectedColor,
    onClose,
    onNavigateToCart,
  });

  const commitQuickViewCartQuantity = useCallback(
    async (q: number) => {
      if (!cartItem?._id) return;
      await setCartQuantity(cartItem._id, q);
    },
    [cartItem?._id, setCartQuantity],
  );

  // Обертки для обработчиков с loading states
  const handleAddToCart = async (quantity: number) => {
    setIsAddingToCart(true);
    try {
      await baseHandleAddToCart(quantity);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async (quantity: number) => {
    setIsBuyingNow(true);
    try {
      await baseHandleBuyNow(quantity);
    } finally {
      setIsBuyingNow(false);
    }
  };

  // Мемоизация процента скидки
  const discountPercent = useMemo(() => {
    if (!product?.oldPrice || !product?.price) return 0;
    return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  }, [product?.oldPrice, product?.price]);

  // На мобилках не показываем вообще
  if (isMobile) return null;

  // Когда модалка закрыта, ничего не рендерить (вообще)
  if (!isOpen) {
    return null;
  }

  // Loading state — скелетон 1024x629
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          showCloseButton={false}
          overlayClassName={QUICK_VIEW_OVERLAY_CLASS}
          className={QUICK_VIEW_DIALOG_CLASS}
        >
          <DialogTitle className="sr-only">Загрузка товара</DialogTitle>
          <div className="flex h-full min-h-0 w-full flex-col lg:flex-row">
            {/* Левая часть: галерея */}
            <div className="bg-muted flex w-full flex-col justify-center gap-4 p-6 lg:w-1/2 lg:p-8">
              <Skeleton className="h-[55%] w-full rounded-xl" />
              <div className="flex gap-2">
                <Skeleton className="h-14 w-14 rounded-md" />
                <Skeleton className="h-14 w-14 rounded-md" />
                <Skeleton className="h-14 w-14 rounded-md" />
                <Skeleton className="h-14 w-14 rounded-md" />
              </div>
            </div>
            {/* Правая часть: инфо о товаре */}
            <div className="flex flex-1 flex-col justify-between px-8 pt-10 pb-8 lg:px-8 lg:pt-12 lg:pb-12">
              <div className="flex flex-col gap-5">
                <Skeleton className="h-8 w-2/3 rounded" />
                <Skeleton className="h-6 w-1/3 rounded" />
                <div className="flex gap-2 items-center mt-2">
                  <Skeleton className="h-8 w-24 rounded" />
                  <Skeleton className="h-8 w-16 rounded" />
                </div>
                <Skeleton className="mt-3 h-4 w-40 rounded" />
                <Skeleton className="mt-2 h-5 w-1/2 rounded" />
                <Skeleton className="mt-1 h-5 w-[60%] rounded" />
                <Skeleton className="mt-1 h-5 w-[45%] rounded" />
              </div>
              <div className="flex gap-4 mt-auto">
                <Skeleton className="h-12 w-40 rounded-lg" />
                <Skeleton className="h-12 w-40 rounded-lg" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (isError || !product) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          showCloseButton={false}
          overlayClassName={QUICK_VIEW_OVERLAY_CLASS}
          className={QUICK_VIEW_DIALOG_CLASS}
        >
          <DialogTitle className="sr-only">Ошибка загрузки</DialogTitle>
          <div className="flex w-full flex-col items-center justify-center gap-4 p-20">
            <div className="text-destructive text-center">
              <p className="mb-2 text-lg font-semibold">Не удалось загрузить товар</p>
              <p className="text-muted-foreground text-sm">Попробуйте позже</p>
            </div>
            {productId && (
              <Button onClick={() => refetch()} variant="outline">
                Обновить страницу
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        overlayClassName={QUICK_VIEW_OVERLAY_CLASS}
        className={QUICK_VIEW_DIALOG_CLASS}
        onEscapeKeyDown={(e) => {
          if (isAddingToCart || isBuyingNow) {
            e.preventDefault();
          }
        }}
      >
        <DialogTitle className="sr-only">Быстрый просмотр товара: {product.name}</DialogTitle>
        <div className="flex h-full min-h-0 w-full flex-col lg:flex-row">
          {/* Галерея изображений */}
          <ProductGallery
            product={product}
            productId={productId!}
            discountPercent={discountPercent}
          />

          {/* Информация о товаре */}
          <div className="bg-card relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col justify-between overflow-y-auto px-6 py-5 lg:w-[50%] lg:px-8 lg:py-6">
            {/* Заголовок */}
            <ProductHeader
              product={product}
              totalCartUnits={totalCartUnits}
              onCopyArticle={handleCopyArticle}
              onClose={onClose}
            />

            {/* Мета-информация (рейтинг, наличие, гарантии) */}
            <ProductMeta
              product={product}
              onClose={onClose}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
              onSelectSize={sizeOptions.length ? setSelectedSize : undefined}
              onSelectColor={colorOptions.length ? setSelectedColor : undefined}
            />

            {/* Цена */}
            <ProductPrice product={product} />

            {/* Действия (корзина, избранное) */}
            <ProductActions
              countInStock={product.countInStock}
              isInCart={inCart}
              isInWishlist={isInWishlist}
              cartItemQuantity={cartItem?.quantity}
              onCommitCartQuantity={
                inCart && cartItem?._id ? commitQuickViewCartQuantity : undefined
              }
              isAddingToCart={isAddingToCart}
              isBuyingNow={isBuyingNow}
              onAddToCart={handleAddToCart}
              onGoToCart={handleGoToCart}
              onBuyNow={handleBuyNow}
              onToggleWishlist={handleToggleWishlist}
            />

            {/* Delivery/Guarantee info */}
            {/* <div
              className="bg-muted flex items-center gap-2 rounded-xl px-4 py-3"
              role="region"
              aria-label="Гарантии"
            >
              <RepeatIcon className="text-primary h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-medium">{RETURN_POLICY_DAYS} дней на возврат</span>
            </div> */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
