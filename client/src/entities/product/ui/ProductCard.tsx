'use client';

import { getProductCatalogHoverVideo } from '@/entities/product/lib/product-gallery';
import { cn } from '@/shared';
import { useQuickViewModal } from '@/shared/store/ui/hooks';
import { Button } from '@/shared/ui/button';
import { CheckCircle2, Eye, Heart, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { formatProductPrice, getProductImage, hasDiscount, isProductInStock } from '../lib/utils';
import type { Product } from '../model/types';

const CATALOG_CARD_MAX_IMAGES = 8;
const CATALOG_CARD_MAX_DOTS = 6;

export interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void | Promise<void>;
  onToggleWishlist: (product: Product) => void | Promise<void>;
  isInWishlist: (itemId: string) => boolean;
  isInCart?: (product: Product) => boolean;
  onCartClick?: (product: Product) => void;
  preferParentHorizontalScroll?: boolean;
}

export const ProductCard = memo<ProductCardProps>(
  ({
    product,
    onAddToCart,
    onToggleWishlist,
    isInWishlist,
    isInCart,
    onCartClick,
    preferParentHorizontalScroll = false,
  }) => {
    /* --- Состояния --- */
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
    const [justAddedToCart, setJustAddedToCart] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [catalogVideoHover, setCatalogVideoHover] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    // Рефы
    const catalogVideoRef = useRef<HTMLVideoElement>(null);
    const imagesContainerRef = useRef<HTMLDivElement>(null);
    const scrollRafRef = useRef<number | null>(null);
    const suppressLinkClickRef = useRef(false);
    const isProgrammaticScrollRef = useRef(false);
    const currentIndexRef = useRef(0);
    const touchStartXRef = useRef<number | null>(null);
    const hasSwipedRef = useRef(false);

    const { actions: quickViewActions } = useQuickViewModal();

    const productImages: { url: string }[] = useMemo(() => {
      const imgs = product?.images;
      let list: { url: string }[] = [];
      if (Array.isArray(imgs) && imgs.length > 0) {
        list = (imgs as (string | { url?: string })[])
          .map((item) => ({ url: typeof item === 'string' ? item.trim() : String(item?.url ?? '').trim() }))
          .filter((x) => x.url);
      } else {
        const fallback = getProductImage(product);
        if (fallback) list = [{ url: fallback }];
        else list = [{ url: '/images/no-image.png' }];
      }
      return list.slice(0, CATALOG_CARD_MAX_IMAGES);
    }, [product]);

    const showDotIndicators =
      productImages.length > 1 && productImages.length <= CATALOG_CARD_MAX_DOTS;
    const showSlideCounter = productImages.length > CATALOG_CARD_MAX_DOTS;

    useEffect(() => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const fn = () => setPrefersReducedMotion(mq.matches);
      mq.addEventListener('change', fn);
      return () => mq.removeEventListener('change', fn);
    }, []);

    const hoverPreviewVideoUrl = useMemo(() => getProductCatalogHoverVideo(product), [product]);

    useEffect(() => {
      const v = catalogVideoRef.current;
      if (!v || !hoverPreviewVideoUrl || prefersReducedMotion) return;
      void v.play().catch(() => { });
    }, [hoverPreviewVideoUrl, prefersReducedMotion]);

    useEffect(() => {
      return () => {
        if (scrollRafRef.current != null) cancelAnimationFrame(scrollRafRef.current);
      };
    }, []);

    useEffect(() => {
      const max = Math.max(0, productImages.length - 1);
      if (currentIndexRef.current <= max) return;
      currentIndexRef.current = max;
      setCurrentIndex(max);
      const container = imagesContainerRef.current;
      if (container) {
        container.scrollTo({ left: container.clientWidth * max, behavior: 'auto' });
      }
    }, [productImages.length]);

    useEffect(() => {
      currentIndexRef.current = 0;
      setCurrentIndex(0);
      setCatalogVideoHover(false);
      imagesContainerRef.current?.scrollTo({ left: 0, behavior: 'auto' });
    }, [product._id]);

    const syncIndexFromScroll = () => {
      const container = imagesContainerRef.current;
      if (!container || productImages.length <= 1) return;
      const slideWidth = container.clientWidth;
      if (slideWidth <= 0) return;
      const nextIndex = Math.min(
        productImages.length - 1,
        Math.max(0, Math.round(container.scrollLeft / slideWidth)),
      );
      if (nextIndex === currentIndexRef.current) return;
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
    };

    const onImagesScroll = () => {
      if (!isProgrammaticScrollRef.current) {
        suppressLinkClickRef.current = true;
      }
      if (scrollRafRef.current != null) cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = requestAnimationFrame(syncIndexFromScroll);
    };

    const goToSlide = useCallback(
      (index: number, behavior: ScrollBehavior = 'smooth') => {
        const container = imagesContainerRef.current;
        if (!container || productImages.length <= 1) return;
        const clamped = Math.max(0, Math.min(index, productImages.length - 1));
        if (
          clamped === currentIndexRef.current &&
          Math.abs(container.scrollLeft - container.clientWidth * clamped) < 1
        ) {
          return;
        }
        const left = container.clientWidth * clamped;
        currentIndexRef.current = clamped;
        setCurrentIndex(clamped);
        if (Math.abs(container.scrollLeft - left) < 1) return;

        isProgrammaticScrollRef.current = true;
        container.scrollTo({
          left,
          behavior: prefersReducedMotion ? 'auto' : behavior,
        });

        const release = () => {
          isProgrammaticScrollRef.current = false;
          container.removeEventListener('scrollend', release);
        };
        if (behavior === 'auto' || prefersReducedMotion) {
          requestAnimationFrame(release);
        } else {
          container.addEventListener('scrollend', release, { once: true });
          window.setTimeout(release, 450);
        }
      },
      [prefersReducedMotion, productImages.length],
    );

    const onImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (productImages.length <= 1) return;
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const index = Math.min(productImages.length - 1, Math.floor(ratio * productImages.length));
      if (index === currentIndexRef.current) return;
      goToSlide(index, 'auto');
    };

    const inStock = isProductInStock(product);
    const isInCartStatus = !!isInCart?.(product) || justAddedToCart;
    const productHasDiscount = hasDiscount(product);

    const productId = typeof product._id === 'string' ? product._id : '';
    const currentlyInWishlist = Boolean(isInWishlist && productId && isInWishlist(productId));

    const handleAddToCart = async () => {
      if (!inStock || isAddingToCart || isInCartStatus) return;
      setIsAddingToCart(true);
      try {
        await onAddToCart(product);
        setJustAddedToCart(true);
        setTimeout(() => setJustAddedToCart(false), 1500);
      } catch (error) {
        console.error('Failed to add to cart:', error);
      } finally {
        setIsAddingToCart(false);
      }
    };

    const handleToggleWishlist = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isTogglingWishlist) return;
      setIsTogglingWishlist(true);
      try {
        await onToggleWishlist(product);
      } catch (error) {
        console.error('Failed to toggle wishlist:', error);
      } finally {
        setIsTogglingWishlist(false);
      }
    };

    return (
      <div
        className={cn(
          'group flex h-full bg-white flex-col overflow-hidden rounded-2xl transition-shadow',
          preferParentHorizontalScroll && 'touch-pan-y',
        )}
      >
        {/* Image Area */}
        <div className="relative w-full shrink-0 bg-card">
          <Link
            href={`/product/${product._id}`}
            className={cn('', preferParentHorizontalScroll && 'touch-pan-y')}
            onClick={(e) => {
              if (suppressLinkClickRef.current) {
                e.preventDefault();
                suppressLinkClickRef.current = false;
              }
            }}
            onPointerDown={() => {
              suppressLinkClickRef.current = false;
            }}
            onDragStart={(e) => {
              e.preventDefault();
            }}
            aria-label={product.name}
            tabIndex={0}
          >
            <div
              className={cn('relative', preferParentHorizontalScroll && 'touch-pan-y')}
              onDragStart={(e) => {
                e.preventDefault();
              }}
              onMouseMove={onImageMouseMove}
              onMouseEnter={() => {
                if (!hoverPreviewVideoUrl || currentIndex !== 0 || prefersReducedMotion) return;
                setCatalogVideoHover(true);
              }}
              onMouseLeave={() => {
                setCatalogVideoHover(false);
                const v = catalogVideoRef.current;
                if (v) {
                  v.pause();
                  v.currentTime = 0;
                }
              }}
            >
              {productHasDiscount && typeof product.oldPrice === 'number' && (
                <p className="absolute bg-pink-500 dark:text-[#f2f2f2] font-bold text-xs rounded-md text-white px-2 py-1 left-2 bottom-2 z-10">
                  {Math.round(100 - (Number(product.price) / Number(product.oldPrice)) * 100)}%
                </p>
              )}

              {/* АВТОПРОИГРЫВАЕМОЕ ВИДЕО ПЕРВЫМ ЭЛЕМЕНТОМ */}
              {hoverPreviewVideoUrl && currentIndex === 0 && (<div className="absolute inset-0 z-[2] rounded-2xl overflow-hidden"> <video ref={catalogVideoRef} src={hoverPreviewVideoUrl} autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover" /> </div>)}

              {/* Карусель изображений + сенсорный свайп */}
              <div
                ref={imagesContainerRef}
                className="product-images-scroll relative z-[1]"
                style={{
                  display: 'flex',
                  overflow: 'hidden clip',
                  scrollBehavior: 'auto',
                }}
                onTouchStart={(e) => {
                  touchStartXRef.current = e.touches[0]?.clientX ?? null;
                  hasSwipedRef.current = false;
                }}
                onTouchMove={(e) => {
                  if (productImages.length <= 1) return;
                  if (touchStartXRef.current == null) return;
                  const dx = (e.touches[0]?.clientX ?? 0) - touchStartXRef.current;
                  const THRESHOLD = 20;
                  if (!hasSwipedRef.current && Math.abs(dx) > THRESHOLD) {
                    hasSwipedRef.current = true;
                    if (dx < 0) {
                      goToSlide(currentIndex + 1);
                    } else {
                      goToSlide(currentIndex - 1);
                    }
                    suppressLinkClickRef.current = true;
                  }
                }}
                onTouchEnd={() => {
                  touchStartXRef.current = null;
                  window.setTimeout(() => {
                    suppressLinkClickRef.current = false;
                  }, 100);
                }}
                onScroll={onImagesScroll}
              >
                {productImages.map((img, index) => (
                  <img
                    key={index}
                    src={img.url}
                    alt={product.name || 'Product'}
                    width={800}
                    height={600}
                    loading="lazy"
                    className={cn(
                      "object-cover",
                      "rounded-2xl",
                      productImages.length > 1 ? "min-w-full snap-start" : "w-full"
                    )}
                  />
                ))}
              </div>

              {/* ИНДИКАТОРЫ ПРОГРЕССА (Исправлено для Turbopack) */}
              {showDotIndicators && (
                <div
                  className="absolute inset-x-8 bottom-0 z-10 flex items-center justify-center gap-1 p-1"
                  role="tablist"
                  aria-label="Фотографии товара"
                >
                  {productImages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={currentIndex === i}
                      aria-label={`Фото ${i + 1} из ${productImages.length}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        goToSlide(i);
                      }}
                      className={cn(
                        'relative block size-2 w-1.5 h-1.5 rounded-full ring-offset-background focus:outline-none focus:ring-0 focus:ring-ring focus:ring-offset-2',
                        currentIndex === i ? 'bg-indigo-500 ring-0 ring-primary' : 'bg-white/90 dark:bg-zinc-300'
                      )}
                    >
                      {/* Для активной точки добавляем внутренний элемент для плавности */}
                      {currentIndex === i && (
                        <span className="absolute inset-0 rounded-full bg-primary animate-pulse"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Счетчик слайдов (если много фото) */}
              {showSlideCounter && (
                <div
                  className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium tabular-nums text-white backdrop-blur-sm"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {currentIndex + 1}/{productImages.length}
                </div>
              )}
            </div>
          </Link>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className="absolute top-1 right-1 cursor-pointer h-8 w-8 flex items-center justify-center rounded-full p-0 transition-opacity z-10"
            aria-label={currentlyInWishlist ? 'Уже в избранном' : 'Добавить в избранное'}
            title={currentlyInWishlist ? 'Уже в избранном' : 'Добавить в избранное'}
            aria-pressed={currentlyInWishlist}
            disabled={isTogglingWishlist}
          >
            {isTogglingWishlist ? (
              <Loader2 className="h-6 w-6 animate-spin text-black dark:text-white" aria-hidden="true" />
            ) : (
              <Heart
                aria-hidden="true"
                className={cn(
                  'h-6 w-6 transition-all duration-150',
                  currentlyInWishlist
                    ? 'fill-red-500 text-red-500'
                    : 'text-black fill-white/90 dark:fill-[#f2f2f231]',
                )}
              />
            )}
          </button>

          {/* Быстрый просмотр */}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              quickViewActions.open(product._id);
            }}
            className={cn(
              'absolute bottom-2 right-2 z-20 hidden size-9 rounded-full md:flex',
              'opacity-0 transition-all duration-200 group-hover:opacity-100',
              'border border-border/30',
              'bg-white/95 shadow-md hover:bg-white hover:shadow-lg',
              'dark:bg-zinc-900/90 dark:hover:bg-zinc-900',
              'backdrop-blur-sm',
              'text-zinc-900 dark:text-zinc-100',
            )}
            aria-label="Быстрый просмотр товара"
            aria-describedby={`quickview-desc-${product._id}`}
            title="Быстрый просмотр"
          >
            <Eye className="h-4 w-4" />
          </Button>

          <span id={`quickview-desc-${product._id}`} className="sr-only">
            Нажмите, чтобы быстро посмотреть товар «{product.name}» без перехода на страницу
          </span>

          {!inStock && (
            <div className="absolute bottom-2 left-2 rounded bg-foreground/70 px-2 py-1 text-xs text-background z-10">
              Нет в наличии
            </div>
          )}
        </div>

        {/* Текстовая часть карточки */}
        <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 pt-1">
          <div className="flex min-h-0 flex-1 flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="font-roboto text-base font-bold text-pink-500">
                {formatProductPrice(product.price)}
              </span>
              {productHasDiscount && typeof product.oldPrice === 'number' && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatProductPrice(product.oldPrice)}
                </span>
              )}
            </div>

            <Link
              href={`/product/${product._id}`}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <h3 className="line-clamp-2 text-xs leading-tight text-foreground transition-colors hover:text-primary">
                {product.name}
              </h3>
            </Link>

            <div className="min-h-[1.25rem] text-xs text-muted-foreground">
              {typeof product.rating === 'number' || product.catName || product.category?.name ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {typeof product.rating === 'number' && (
                    <span className="flex items-center gap-0.5">
                      <FaStar className="text-yellow-500" size={14} aria-hidden />
                      {product.rating.toFixed(1)}
                      {product.reviewCount ? ` (${product.reviewCount})` : ''}
                    </span>
                  )}
                  {(product.category?.name || product.catName) && (
                    <>
                      {typeof product.rating === 'number' && (
                        <span className="text-muted-foreground">•</span>
                      )}
                      <span className="line-clamp-1">
                        {product.category?.name || product.catName}
                      </span>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-auto w-full pt-2">
            <Button
              size="lg"
              className={cn(
                'h-auto w-full rounded-lg dark:text-[#f2f2f2] py-2 transition-all',
                !inStock
                  ? 'cursor-not-allowed hover:text-white bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground'
                  : isInCartStatus
                    ? 'bg-success text-white hover:bg-success/90 dark:bg-success dark:hover:bg-success/90'
                    : justAddedToCart
                      ? 'bg-success text-white hover:bg-success/90 dark:bg-success dark:hover:bg-success/90'
                      : 'bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90',
              )}
              onClick={() => {
                if (!inStock || isAddingToCart) return;
                if (isInCartStatus && onCartClick) {
                  onCartClick(product);
                } else {
                  handleAddToCart();
                }
              }}
              disabled={!inStock || isAddingToCart}
              aria-disabled={!inStock || isAddingToCart}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Добавление...
                </>
              ) : justAddedToCart || isInCartStatus ? (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {isInCartStatus && onCartClick ? 'Товар в корзине' : 'Добавлено'}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <svg
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    viewBox="0 0 576 512"
                    height="17"
                    width="17"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M253.3 35.1c6.1-11.8 1.5-26.3-10.2-32.4s-26.3-1.5-32.4 10.2L117.6 192 32 192c-17.7 0-32 14.3-32 32s14.3 32 32 32L83.9 463.5C91 492 116.6 512 146 512L430 512c29.4 0 55-20 62.1-48.5L544 256c17.7 0 32-14.3 32-32s-14.3-32-32-32l-85.6 0L365.3 12.9C359.2 1.2 344.7-3.4 332.9 2.7s-16.3 20.6-10.2 32.4L404.3 192l-232.6 0L253.3 35.1zM192 304l0 96c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-96c0-8.8 7.2-16 16-16s16 7.2 16 16zm96-16c8.8 0 16 7.2 16 16l0 96c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-96c0-8.8 7.2-16 16-16zm128 16l0 96c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-96c0-8.8 7.2-16 16-16s16 7.2 16 16z"></path>
                  </svg>
                  {!inStock ? 'Нет в наличии' : 'Завтра'}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

ProductCard.displayName = 'ProductCard';