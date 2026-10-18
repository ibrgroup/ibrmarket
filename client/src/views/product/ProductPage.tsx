'use client';

import { cartLinesSameVariant, useCartStore } from '@/entities/cart';
import { CHECKOUT_ONLY_LINE_IDS_SESSION_KEY } from '@/entities/cart/lib/checkout-session-storage';
import {
  collectProductGallerySlides,
  getProductSizeLabel,
  pickCartImageFromGallery,
  ProductColorPicker,
  useProduct,
  useProductRailActions,
  useSimilarProducts,
} from '@/entities/product';
import { useReviewStats } from '@/entities/review';
import { useWishlistStore } from '@/entities/wishlist';
import { ReviewList, ReviewRatingDisplay } from '@/features/product-reviews';
import { ProductSpecificationsDrawer } from '@/features/product-specifications-drawer';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tabs } from '@/shared/ui/tabs';
import { ProductGallerySection } from '@/views/product/[id]/ProductGallerySection';
import { ProductCarouselSection } from '@/widgets/product-carousel';
import {
  Check,
  CopyIcon,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  Star,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const { product, loading, error } = useProduct(productId);
  const { data: reviewStats } = useReviewStats(productId);

  const { addItem } = useCartStore();
  const cartItems = useCartStore((s) => s.items);
  const setCartQuantity = useCartStore((s) => s.setQuantity);
  const selectOnlyItem = useCartStore((s) => s.selectOnlyItem);
  const {
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
    isInWishlist,
  } = useWishlistStore();

  const [gallerySlideIndex, setGallerySlideIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [addToCartState, setAddToCartState] = useState<'idle' | 'loading' | 'added'>('idle');
  const [buyNowBusy, setBuyNowBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [specificationsDrawerOpen, setSpecificationsDrawerOpen] = useState(false);

  const displayProduct = product;

  const gallerySlides = useMemo(() => collectProductGallerySlides(product), [product]);

  const sizeOptions = useMemo(
    () => (product?.size || []).filter((s): s is string => Boolean(s && String(s).trim())),
    [product?.size],
  );
  const colorOptions = useMemo(
    () => (product?.colors || []).filter((c): c is string => Boolean(c && String(c).trim())),
    [product?.colors],
  );

  useEffect(() => {
    if (!product) return;
    setSelectedSize(sizeOptions[0] || '');
    setSelectedColor(colorOptions[0] || '');
  }, [product?._id, sizeOptions, colorOptions]);

  const matchingLine = useMemo(() => {
    if (!product) return undefined;
    const key = {
      productId: product._id,
      size: selectedSize,
      color: selectedColor,
      weight: '' as const,
      ram: '' as const,
    };
    return cartItems.find((i) => cartLinesSameVariant(i, key));
  }, [cartItems, product, selectedSize, selectedColor]);

  const showQtyControls = Boolean(matchingLine);

  const galleryImageIndex =
    gallerySlides.length > 0 ? Math.min(gallerySlideIndex, gallerySlides.length - 1) : 0;

  const buildCartLinePayload = () => {
    if (!product) return null;
    const imageSrc = pickCartImageFromGallery(
      gallerySlides,
      galleryImageIndex,
      product.images?.[0] || '/placeholder.png',
    );
    return {
      productId: product._id,
      productTitle: product.name,
      name: product.name,
      image: imageSrc,
      price: product.price,
      oldPrice: product.oldPrice,
      discount: product.discount,
      quantity: 1,
      brand: product.brand,
      rating: product.rating || 4.5,
      isSelected: true,
      ...(selectedSize ? { size: selectedSize } : {}),
      ...(selectedColor ? { color: selectedColor } : {}),
    };
  };

  const handleAddToCart = async () => {
    if (!displayProduct || !product) return;

    if (sizeOptions.length > 0 && !selectedSize) {
      toast.error('Выберите размер');
      return;
    }
    if (colorOptions.length > 0 && !selectedColor) {
      toast.error('Выберите цвет');
      return;
    }
    const cartItem = buildCartLinePayload();
    if (!cartItem) return;

    setAddToCartState('loading');
    try {
      await addItem(cartItem);
      setAddToCartState('added');
      toast.success('Товар добавлен в корзину');
      setTimeout(() => setAddToCartState('idle'), 1400);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setAddToCartState('idle');
      toast.error('Ошибка при добавлении в корзину');
    }
  };

  const handleBuyNow = async () => {
    if (!displayProduct || !product) return;
    if (sizeOptions.length > 0 && !selectedSize) {
      toast.error('Выберите размер');
      return;
    }
    if (colorOptions.length > 0 && !selectedColor) {
      toast.error('Выберите цвет');
      return;
    }
    const productInStock =
      Boolean(displayProduct.inStock) ||
      (typeof displayProduct.countInStock === 'number' && displayProduct.countInStock > 0);
    if (!productInStock) return;

    const variantKey = {
      productId: product._id,
      size: selectedSize,
      color: selectedColor,
      weight: '' as const,
      ram: '' as const,
    };

    setBuyNowBusy(true);
    try {
      let lineId = matchingLine?._id;
      if (!lineId) {
        const cartItem = buildCartLinePayload();
        if (!cartItem) {
          return;
        }
        await addItem(cartItem);
        const line = useCartStore.getState().items.find((i) => cartLinesSameVariant(i, variantKey));
        lineId = line?._id;
      }
      if (!lineId) {
        toast.error('Не удалось подготовить заказ');
        return;
      }
      selectOnlyItem(lineId);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(CHECKOUT_ONLY_LINE_IDS_SESSION_KEY, JSON.stringify([lineId]));
      }
      router.push('/checkout');
    } catch (e) {
      console.error('Buy now failed:', e);
      toast.error('Не удалось перейти к оформлению');
    } finally {
      setBuyNowBusy(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!displayProduct || !product) return;

    try {
      const productIdToCheck = product._id;

      if (isInWishlist(productIdToCheck)) {
        const wishlistItem = useWishlistStore
          .getState()
          .items.find((item) => item.productId === productIdToCheck);
        if (wishlistItem) {
          await removeFromWishlist(wishlistItem._id);
          toast.success('Товар удален из избранного');
        }
      } else {
        const imageSrc = pickCartImageFromGallery(
          gallerySlides,
          galleryImageIndex,
          product.images?.[0] || '/placeholder.png',
        );
        const wishlistItem = {
          productId: product._id,
          name: product.name,
          productTitle: product.name,
          image: imageSrc,
          price: product.price || 0,
          oldPrice: product.oldPrice !== undefined ? product.oldPrice : product.price || 0,
          discount: product.discount !== undefined ? product.discount : 0,
          brand: product.brand || '',
          rating: product.rating !== undefined ? product.rating : 0,
        };
        await addToWishlist(wishlistItem);
        toast.success('Товар добавлен в избранное');
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      toast.error('Ошибка при изменении избранного');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayProduct?.name,
          text: `Посмотрите на этот товар: ${displayProduct?.name}`,
          url: window.location.href,
        });
      } catch {
        // Пользователь отменил шаринг
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success('Ссылка скопирована!');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Не удалось скопировать ссылку');
      }
    }
  };

  const { data: similarProducts = [] } = useSimilarProducts(productId, 16, Boolean(productId));
  const railSimilar = useProductRailActions();
  const similarForCard = useMemo(
    () => similarProducts.filter((p) => p._id !== productId),
    [similarProducts, productId],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-2 py-8 sm:px-4 lg:px-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-12">
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-20 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4 rounded" />
              <Skeleton className="h-6 w-1/2 rounded" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 sm:h-24 sm:w-24 dark:bg-red-900/20">
              <span className="text-3xl text-red-500 sm:text-4xl">!</span>
            </div>
            <h1 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">Товар не найден</h1>
            <p className="text-muted-foreground">
              {error || 'К сожалению, запрашиваемый товар не найден'}
            </p>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <Button asChild className="w-full">
              <Link href="/products">Вернуться в каталог</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">На главную</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!displayProduct) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted sm:h-24 sm:w-24">
              <span className="text-3xl text-gray-400 sm:text-4xl dark:text-zinc-500">?</span>
            </div>
            <h1 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">Товар не найден</h1>
            <p className="text-muted-foreground">Возможно, товар был удалён или перемещён</p>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <Button asChild className="w-full">
              <Link href="/products">Вернуться в каталог</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">На главную</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isWishlisted = product ? isInWishlist(product._id) : false;
  const inStock =
    Boolean(displayProduct.inStock) ||
    (typeof displayProduct.countInStock === 'number' && displayProduct.countInStock > 0);
  const hasDiscount = Boolean(
    displayProduct.discount > 0 &&
      displayProduct.oldPrice &&
      displayProduct.oldPrice > displayProduct.price,
  );

  return (
    <div className="md:w-[1416px] md:m-auto">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <ProductGallerySection
          key={displayProduct._id}
          productName={displayProduct.name}
          gallerySlides={gallerySlides}
          hasDiscount={hasDiscount}
          discountPercent={displayProduct.discount}
          inStock={Boolean(inStock)}
          isWishlisted={isWishlisted}
          copied={copied}
          onWishlistClick={handleToggleWishlist}
          onShareClick={handleShare}
          onSlideChange={setGallerySlideIndex}
        />

        <section className="flex min-w-0 flex-col gap-3 lg:col-span-4 xl:col-span-4">
         <div className='flex justify-between items-center gap-3 bg-white p-1.5 px-3 rounded-3xl'>
           <div className="flex items-center gap-3">
            {displayProduct.category?.name || displayProduct.catName ? (
              <Badge variant="secondary" className="text-xs bg-pink-500/90 text-white">
                {displayProduct.category?.name || displayProduct.catName}
              </Badge>
            ) : null}
            {displayProduct.brand && (
              <Badge variant="outline" className="text-xs border-none text-white bg-green-500/90">
                {displayProduct.brand}
              </Badge>
            )}
      
          </div>
                          <div className="hidden justify-between gap-3 p-2 rounded-2xl lg:flex">
            <div></div>
            <div className="flex justify-between gap-3 items-center">
              <button
                onClick={handleToggleWishlist}
                className={`bg-white/0 cursor-pointer transition-all hover:text-indigo-500 shadow-none border-none ${isWishlisted ? '' : ''}`}
              >
                <Heart className={`${isWishlisted ? 'fill-rose-500  text-rose-500' : ''}`} />
                {isWishlisted ? '' : ''}
              </button>
              <button
                onClick={handleShare}
                className="cursor-pointer transition-all hover:text-"
              >
                <Share2 className={` ${copied ? 'text-green-500' : ''}`} />
                {copied ? '' : ''}
              </button>
            </div>
          </div>
         </div>
              <div className="rounded-3xl block lg:hidden bg-card p-3">

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-roboto border-none text-pink-500 sm:text-3xl">
                  {displayProduct.price.toLocaleString('ru-RU')} ₽
                </span>
                {hasDiscount && displayProduct.oldPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {displayProduct.oldPrice.toLocaleString('ru-RU')} ₽
                  </span>
                )}
              </div>
              {hasDiscount && (
                <div className="flex items-center justify-between">
                  <p className="text-base font-roboto font-semibold text-green-500 dark:text-green-400">
                    Экономия:{' '}
                    {(
                      (displayProduct.oldPrice || displayProduct.price) - displayProduct.price
                    ).toLocaleString('ru-RU')}{' '}
                    ₽
                  </p>
                  <Badge className="bg-pink-500 text-white font-bold text-xs">
                    Скидка {displayProduct.discount}%
                  </Badge>
                </div>
              )}
            </div>
            {sizeOptions.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-foreground">Размер</p>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      size="sm"
                      variant={selectedSize === s ? 'default' : 'outline'}
                      className="rounded-md p-4 py-5"
                      onClick={() => setSelectedSize(s)}
                    >
                      {getProductSizeLabel(s)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <ProductColorPicker
              colors={colorOptions}
              selected={selectedColor}
              onSelect={setSelectedColor}
            />
            <div className="mt-3 flex max-md:hidden flex-col gap-3">
              {showQtyControls && matchingLine ? (
                <>
                  <div className="flex h-13 w-full items-center gap-3 rounded-2xl bg-muted p-2">
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() =>
                        void setCartQuantity(matchingLine._id, matchingLine.quantity - 1)
                      }
                      className="border-none bg-muted shadow-none"
                      aria-label="Уменьшить количество или убрать из корзины"
                    >
                      <Minus className="h-5 w-5 text-indigo-500" />
                    </Button>
                    <p
                      className="m-auto flex flex-1 justify-center bg-muted"
                      aria-label="Количество товара"
                    >
                      {matchingLine.quantity}
                    </p>
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() =>
                        setCartQuantity(
                          matchingLine._id,
                          Math.min(displayProduct.countInStock, matchingLine.quantity + 1),
                        )
                      }
                      disabled={matchingLine.quantity >= displayProduct.countInStock}
                      className="h-8 w-8 border-none bg-muted shadow-none"
                      aria-label="Увеличить количество"
                    >
                      <Plus className="h-5 w-5 text-indigo-500" />
                    </Button>
                  </div>
                  <Button variant="outline" className="h-11 w-full rounded-2xl" asChild>
                    <Link href="/cart">Перейти в корзину</Link>
                  </Button>
                </>
              ) : (
                <div className="max-md:hidden">
                  <Button
                    size="default"
                    className="h-13 w-full rounded-2xl bg-primary text-white hover:bg-primary/90"
                    onClick={handleAddToCart}
                    disabled={
                      !inStock || addToCartState === 'loading' || addToCartState === 'added'
                    }
                  >
                    {addToCartState === 'idle' && inStock && <>Добавить в корзину</>}
                    {addToCartState === 'loading' && (
                      <>
                        <div className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-white" />
                        Добавление...
                      </>
                    )}
                    {addToCartState === 'added' && (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Добавлено!
                      </>
                    )}
                    {!inStock && 'Нет в наличии'}
                  </Button>
                </div>
              )}
            </div>
            <div className="bg-card p-3">
              <h3 className="mb-2 text-foreground font-semibold text-md">
                Условия доставки и гарантии
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Truck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">
                      Бесплатная доставка
                    </p>
                    <p className="text-xs text-muted-foreground">При заказе от 2000 ₽</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">
                      Гарантия качества
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Официальная гарантия производителя
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <RotateCcw className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">Возврат товара</p>
                    <p className="text-xs text-muted-foreground">В течение 14 дней</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card space-y-3 p-4 rounded-3xl">
            <h1 className="text-xl  md:text-2xl font-bold font-roboto leading-tight text-foreground">
              {displayProduct.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              {reviewStats && reviewStats.totalReviews > 0 ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                          i < Math.round(reviewStats.averageRating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-zinc-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                    {reviewStats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({reviewStats.totalReviews}{' '}
                    {reviewStats.totalReviews === 1
                      ? 'отзыв'
                      : reviewStats.totalReviews < 5
                        ? 'отзыва'
                        : 'отзывов'}
                    )
                  </span>
                </div>
              ) : (
                typeof displayProduct.rating === 'number' &&
                displayProduct.rating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                            i < Math.round(displayProduct.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 dark:text-zinc-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                      {displayProduct.rating.toFixed(1)}
                    </span>
                    {displayProduct.reviewCount && (
                      <span className="text-xs text-muted-foreground">
                        ({displayProduct.reviewCount} отзывов)
                      </span>
                    )}
                  </div>
                )
              )}

              <button
                type="button"
                className="text-xs cursor-pointer items-center flex gap-2 text-muted-foreground hover:text-primary transition-colors ml-0.5"
                title="Кликните, чтобы скопировать артикул"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(displayProduct._id);
                    setCopied(true);
                    toast.success('Артикул скопирован!');
                    setTimeout(() => setCopied(false), 1200);
                  } catch {
                    toast.error('Ошибка при копировании артикула');
                  }
                }}
              >
                Артикул: {displayProduct._id}           <button
                  type="button"
                  className="text-muted-foreground cursor-pointer hover:text-indigo-500 dark:hover:text-purple-400"
                  aria-label="Копировать артикул"
                  onClick={() => {
                    void navigator.clipboard.writeText(displayProduct._id);
                    toast.success('Артикул скопирован');
                  }}
                >
                  <CopyIcon className="h-5 w-5" />
                </button>
              </button>
            </div>
          </div>
      
          <Card className="w-full p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-roboto font-bold text-foreground">Описание товара</h2>
              {displayProduct.description && displayProduct.description.length > 160 && (
                <Dialog>
                  <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle className="text-left">{displayProduct.name}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {displayProduct.description}
                    </p>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <p
              className={`max-w-prose text-[13px] leading-relaxed text-foreground ${
                !descriptionExpanded && 'line-clamp-4'
              }`}
            >
              {displayProduct.description ||
                'Подробное описание товара отсутствует. Мы работаем над добавлением описания.'}
            </p>
            <div>
              {displayProduct.description &&
                displayProduct.description.length > 200 &&
                !descriptionExpanded && (
                  <Button
                    variant="link"
                    onClick={() => setDescriptionExpanded(true)}
                    className="mt-1 h-auto p-0 text-sm text-primary"
                  >
                    Показать полностью
                  </Button>
                )}
              {descriptionExpanded && (
                <Button
                  variant="link"
                  onClick={() => setDescriptionExpanded(false)}
                  className="mt-1 h-auto p-0 text-sm text-primary"
                >
                  Свернуть
                </Button>
              )}
            </div>
          </Card>

          <Card className="w-full p-4 rounded-3xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-roboto font-bold text-foreground">
                Основные характеристики
              </h2>
            </div>
            <div className="max-w-prose space-y-1.5 divide-y divide-border">
              
              {displayProduct.brand && (
                <div className="grid grid-cols-1 gap-1 py-2 text-xs sm:grid-cols-[minmax(0,7rem)_1fr] sm:items-center">
                  <span className="font-medium text-muted-foreground">Бренд</span>
                  <span className="font-semibold text-foreground">{displayProduct.brand}</span>
                </div>
              )}
              {(displayProduct.category?.name || displayProduct.catName) && (
                <div className="grid grid-cols-1 gap-1 py-2 text-xs sm:grid-cols-[minmax(0,7rem)_1fr] sm:items-center">
                  <span className="font-medium text-muted-foreground">Категория</span>
                  <span className="font-semibold text-foreground">
                    {displayProduct.category?.name || displayProduct.catName}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 gap-1 py-2 text-xs sm:grid-cols-[minmax(0,7rem)_1fr] sm:items-center">
                <span className="font-medium text-muted-foreground">Наличие</span>
                <span
                  className={`font-semibold ${
                    inStock
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {inStock ? 'В наличии' : 'Нет в наличии'}
                </span>
                
              </div>
              
              {displayProduct.countInStock > 0 && (
                <div className="grid grid-cols-1 gap-1 py-2 text-xs sm:grid-cols-[minmax(0,7rem)_1fr] sm:items-center">
                  <span className="font-medium text-muted-foreground">Количество</span>
                  <span className="font-semibold text-foreground">
                    {displayProduct.countInStock} шт.
                  </span>
                </div>
              )}
              
            </div>
                          <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg p-3 border-none shadow-none bg-gray-100 flex-1 text-sm font-medium"
                onClick={() => setSpecificationsDrawerOpen(true)}
              >
                Все характеристики
              </Button>
          </Card>
          
        </section>
        
        <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20 lg:col-span-3 lg:self-start xl:col-span-3">

          <div className="rounded-3xl hidden lg:block bg-card p-4">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-roboto border-none text-pink-500 sm:text-3xl">
                  {displayProduct.price.toLocaleString('ru-RU')} ₽
                </span>
                {hasDiscount && displayProduct.oldPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {displayProduct.oldPrice.toLocaleString('ru-RU')} ₽
                  </span>
                )}
              </div>
              {hasDiscount && (
                <div className="flex items-center justify-between">
                  <p className="text-base font-roboto font-semibold text-green-500 dark:text-green-400">
                    Экономия:{' '}
                    {(
                      (displayProduct.oldPrice || displayProduct.price) - displayProduct.price
                    ).toLocaleString('ru-RU')}{' '}
                    ₽
                  </p>
                  <Badge className="bg-pink-500 text-white font-bold text-xs">
                    Скидка {displayProduct.discount}%
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {sizeOptions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Размер</p>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((s) => (
                      <Button
                        key={s}
                        type="button"
                        size="sm"
                        variant={selectedSize === s ? 'default' : 'outline'}
                        className="rounded-md h-9"
                        onClick={() => setSelectedSize(s)}
                      >
                        {getProductSizeLabel(s)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <ProductColorPicker
                colors={colorOptions}
                selected={selectedColor}
                onSelect={setSelectedColor}
              />
              {showQtyControls && matchingLine ? (
                <div className='flex items-center justify-between gap-3'>
                  <div className="flex w-full items-center gap-3 rounded-2xl bg-muted p-2">
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() =>
                        void setCartQuantity(matchingLine._id, matchingLine.quantity - 1)
                      }
                      className="border-none bg-muted shadow-none"
                      aria-label="Уменьшить количество или убрать из корзины"
                    >
                      <Minus className="h-5 w-5 text-indigo-500" />
                    </Button>
                    <p className="flex flex-1 justify-center bg-muted" aria-label="Количество">
                      {matchingLine.quantity}
                    </p>
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() =>
                        setCartQuantity(
                          matchingLine._id,
                          Math.min(displayProduct.countInStock, matchingLine.quantity + 1),
                        )
                      }
                      disabled={matchingLine.quantity >= displayProduct.countInStock}
                      className="h-8 w-8 border-none bg-muted shadow-none"
                      aria-label="Увеличить количество"
                    >
                      <Plus className="h-5 w-5 text-indigo-500" />
                    </Button>
                  </div>
                  <Button variant="outline" className="h-13 font-semibold text-sm w-full rounded-2xl border-none bg-gray-100" asChild>
                    <Link href="/cart">Перейти в корзину</Link>
                  </Button>
                </div>
              ) : (
                <Button
                  size="default"
                  className="h-13 w-full font-semibold text-sm rounded-2xl bg-primary text-white hover:bg-primary/90"
                  onClick={handleAddToCart}
                  disabled={!inStock || addToCartState === 'loading' || addToCartState === 'added'}
                >
                  {addToCartState === 'idle' && inStock && <>Добавить в корзину</>}
                  {addToCartState === 'loading' && (
                    <>
                      <div className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-white" />
                      Добавление...
                    </>
                  )}
                  {addToCartState === 'added' && (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Добавлено!
                    </>
                  )}
                  {!inStock && 'Нет в наличии'}
                </Button>
              )}
            </div>
            <div className="bg-card p-3">
              <h3 className="mb-2 text-foreground font-semibold font-md text-lg">
                Условия доставки и гарантии
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Truck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">
                      Бесплатная доставка
                    </p>
                    <p className="text-xs text-muted-foreground">При заказе от 2000 ₽</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">
                      Гарантия качества
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Официальная гарантия производителя
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <RotateCcw className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">Возврат товара</p>
                    <p className="text-xs text-muted-foreground">В течение 14 дней</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Панель действий над нижней навигацией (только мобильные) */}
      <div
        className={cn(
          'fixed inset-x-0 z-[49] md:hidden',
          'pointer-events-none',
          'bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px)+0.5rem)] px-3',
        )}
        role="region"
        aria-label="Действия с товаром"
      >
        <div
          className={cn(
            'pointer-events-auto mx-auto flex max-w-md min-h-12 flex-row items-stretch gap-2 rounded-[1.35rem]',
            'border border-border/70 bg-background/95 p-2 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.18)] backdrop-blur-md',
            'dark:border-white/[0.08] dark:bg-background/95',
          )}
        >
          <Button
            type="button"
            size="default"
            className="h-12 min-h-12 min-w-0 flex-1 rounded-2xl px-2 text-sm font-semibold shadow-none sm:px-3 sm:text-base"
            onClick={() => void handleBuyNow()}
            disabled={!inStock || buyNowBusy || addToCartState === 'loading'}
          >
            {buyNowBusy ? (
              <>
                <div className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-primary-foreground border-b-transparent" />
                <span className="truncate">Переход...</span>
              </>
            ) : !inStock ? (
              <span className="truncate">Нет в наличии</span>
            ) : (
              <span className="truncate">Купить сейчас</span>
            )}
          </Button>

          {showQtyControls && matchingLine ? (
            <div className="flex min-w-0 flex-1 items-center gap-0.5 rounded-2xl bg-muted/90 px-0.5 py-0.5 dark:bg-muted/50">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-9 shrink-0 rounded-xl border-none bg-transparent shadow-none sm:h-11 sm:w-10"
                onClick={() => void setCartQuantity(matchingLine._id, matchingLine.quantity - 1)}
                aria-label="Уменьшить количество или убрать из корзины"
              >
                <Minus className="h-4 w-4 text-indigo-500 sm:h-5 sm:w-5" />
              </Button>
              <span
                className="min-w-6 flex-1 text-center text-sm font-semibold tabular-nums text-foreground sm:text-base"
                aria-live="polite"
              >
                {matchingLine.quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-9 shrink-0 rounded-xl border-none bg-transparent shadow-none sm:h-11 sm:w-10"
                onClick={() =>
                  void setCartQuantity(
                    matchingLine._id,
                    Math.min(displayProduct.countInStock, matchingLine.quantity + 1),
                  )
                }
                disabled={matchingLine.quantity >= displayProduct.countInStock}
                aria-label="Увеличить количество"
              >
                <Plus className="h-4 w-4 text-indigo-500 sm:h-5 sm:w-5" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="default"
              className="h-12 min-h-12 min-w-0 flex-1 rounded-2xl px-2 text-sm font-semibold sm:px-3 sm:text-base"
              onClick={() => void handleAddToCart()}
              disabled={!inStock || buyNowBusy || addToCartState === 'loading'}
            >
              {addToCartState === 'loading' ? (
                <>
                  <div className="mr-1 h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-primary border-b-transparent" />
                  <span className="truncate">Добавление...</span>
                </>
              ) : addToCartState === 'added' ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">В корзине</span>
                </>
              ) : !inStock ? (
                <span className="truncate">Нет в наличии</span>
              ) : (
                <span className="truncate">В корзину</span>
              )}
            </Button>
          )}
        </div>
      </div>

      <ProductSpecificationsDrawer
        product={displayProduct}
        open={specificationsDrawerOpen}
        onOpenChange={setSpecificationsDrawerOpen}
        inStock={inStock}
      />

      <Tabs defaultValue="description" className="mt-8 w-full min-w-0 max-w-full">
        <div className="min-w-0 max-w-full space-y-6">
          <Card className="p-6">
            {reviewStats && reviewStats.totalReviews > 0 ? (
              <ReviewRatingDisplay
                averageRating={reviewStats.averageRating}
                totalReviews={reviewStats.totalReviews}
                ratingDistribution={reviewStats.ratingDistribution}
              />
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground">Пока нет отзывов об этом товаре</p>
              </div>
            )}
          </Card>

          <ReviewList productId={productId} />

          <ProductCarouselSection
            title="Вам также может понравиться"
            className='rounded-3xl'
            subtitle="Похожие товары из той же категории и хиты каталога"
            products={similarForCard}
            onAddToCart={railSimilar.onAddToCart}
            onToggleWishlist={railSimilar.onToggleWishlist}
            isInWishlist={railSimilar.isInWishlist}
            isInCart={railSimilar.isInCart}
          />
        </div>
      </Tabs>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @media (prefers-color-scheme: dark) {
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #475569;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
        }
      `}</style>
    </div>
  );
}
