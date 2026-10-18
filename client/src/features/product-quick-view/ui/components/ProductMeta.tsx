'use client';

import type { Product } from '@/entities/product';
import { getProductColorVisual, getProductImage, getProductSizeLabel, ProductColorPicker } from '@/entities/product';
import { ROUTES, STOCK_THRESHOLDS } from '@/features/product-quick-view/model/constants';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { HorizontalFreeSwipe } from '@/shared/ui/horizontal-free-swipe';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SwiperSlide } from 'swiper/react';

interface ProductMetaProps {
  product: Product;
  onClose: () => void;
  /** Выбор варианта (как на странице товара); без колбэков — только просмотр списка. */
  selectedSize?: string;
  selectedColor?: string;
  onSelectSize?: (value: string) => void;
  onSelectColor?: (value: string) => void;
}

function normList(list?: (string | null)[]): string[] {
  if (!Array.isArray(list)) return [];
  return list.map((v) => String(v ?? '').trim()).filter(Boolean);
}

export function ProductMeta({
  product,
  onClose,
  selectedSize = '',
  selectedColor = '',
  onSelectSize,
  onSelectColor,
}: ProductMetaProps) {
  const stockStatus = product.countInStock ?? 0;
  const stockColorClass = cn(
    'font-semibold',
    stockStatus > STOCK_THRESHOLDS.HIGH
      ? 'text-green-600 dark:text-green-400'
      : stockStatus > STOCK_THRESHOLDS.LOW
        ? 'text-pink-500 dark:text-yellow-400'
        : 'text-destructive',
  );

  const sizeOptions = normList(product.size);
  const colorOptions = normList(product.colors);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  
    const images = useMemo(() => {
      return product.images && product.images.length > 0
        ? product.images
        : [getProductImage(product)];
    }, [product]);
  
    // Обработка ошибок изображений
    const handleImageError = useCallback(
      (index: number) => {
        setImageErrors((prev) => new Set(prev).add(index));
        // imageErrors?.(index);
      },
      [imageErrors],
    );
  
    // Навигация по изображениям
    const handlePrevImage = useCallback(() => {
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);
  
    const handleNextImage = useCallback(() => {
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, [images.length]);
  
    const handleImageSelect = useCallback(
      (index: number) => {
        if (index >= 0 && index < images.length) {
          setCurrentImageIndex(index);
        }
      },
      [images.length],
    );
  
    useEffect(() => {
      setCurrentImageIndex(0);
      setImageErrors(new Set());
    }, [product]);
  
    // Keyboard navigation
    useEffect(() => {
      if (images.length <= 1) return;
  
      const handleKeyDown = (event: KeyboardEvent) => {
        // Проверяем, что фокус находится внутри галереи
        const gallery = document.querySelector('[data-gallery]');
        if (!gallery || !gallery.contains(document.activeElement)) return;
  
        // Предотвращаем навигацию только для стрелок, если не в input/textarea
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
  
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          handlePrevImage();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          handleNextImage();
        }
      };
  
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [images.length, handlePrevImage, handleNextImage]);
  
    // Вычисляем какие изображения нужно рендерить (текущее + соседние для плавности)


  const reviewText =
    product.reviewCount === 1
      ? 'отзыв'
      : product.reviewCount && product.reviewCount < 5
        ? 'отзыва'
        : 'отзывов';

  // Helper to render color pills (standalone, not selectable)
  const renderColorPill = (c: string) => (
    <span className="bg-muted text-foreground inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold">
      <span
        className="h-3 w-3 shrink-0 rounded-full border border-black/20 dark:border-white/25"
        style={getProductColorVisual(c).style}
        aria-hidden
      />
      {getProductColorVisual(c).label}
    </span>
  );

  return (
    <>
      {/* Rating & Reviews */}
      <div className="flex items-center gap-2" role="group" aria-label="Рейтинг и отзывы">
        <Star className="fill-warning text-warning h-5 w-5" aria-hidden="true" />
        <span
          className="text-foreground text-lg font-bold"
          aria-label={`Рейтинг ${product.rating?.toFixed(1) || '0.0'} из 5`}
        >
          {product.rating?.toFixed(1) || '0.0'}
        </span>
        <span className="text-muted-foreground text-sm" aria-hidden="true">
          |
        </span>
        <span className="text-muted-foreground text-sm">
          {product.reviewCount || 0} {reviewText}
        </span>
              <div className='py-2'>
        <span className="text-muted-foreground text-xs font-medium sm:text-sm">
          В наличии:{' '}
          <span className={stockColorClass} aria-live="polite">
            {stockStatus > 0 ? stockStatus : 'Нет в наличии'}
          </span>
        </span>
      </div>
      </div>

      {/* Stock info */}
      {images.length > 1 && (
        <div
          className="flex mb-2 items-center gap-3"
        >
          {images.map((img, index) => {
            const hasError = imageErrors.has(index);
            return (
              <button
                key={`thumb-${product}-${index}`}
                onClick={() => handleImageSelect(index)}
                className={cn(
                  'relative flex-shrink-0 h-20 w-16 overflow-hidden rounded-lg cursor-pointer transition-all',
                  'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  index === currentImageIndex
                    ? 'ring-2 ring-primary ring-offset-1 scale-105 opacity-100'
                    : 'opacity-60 hover:opacity-100',
                )}
                aria-label={`Показать изображение ${index + 1}`}
                aria-current={index === currentImageIndex ? 'true' : 'false'}
                type="button"
              >
                {hasError ? (
                  <div className="bg-muted flex h-full w-full items-center justify-center">
                    <span className="text-muted-foreground text-xs">?</span>
                  </div>
                ) : (
                  <img
                    src={img}
                    alt={`Миниатюра ${index + 1}`}
                    // fill
                    className="object-cover object-center"
                    sizes="64px"
                    loading="lazy"
                    onError={() => handleImageError(index)}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
      {/* Size / Color — всё в одной строке по цветам, горизонтально прокручиваемое если много */}
      {(sizeOptions.length > 0 || colorOptions.length > 0) && (
        <div className="mb-3 flex flex-col gap-2">
          {sizeOptions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium">Размер</p>
              {onSelectSize ? (
                <HorizontalFreeSwipe spaceBetween={6}>
                  {sizeOptions.map((s) => (
                    <SwiperSlide key={s} className="!w-auto">
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedSize === s ? 'default' : 'outline'}
                        className="h-8 min-h-0 rounded-md px-2.5 text-xs font-medium"
                        onClick={() => onSelectSize(s)}
                      >
                        {getProductSizeLabel(s)}
                      </Button>
                    </SwiperSlide>
                  ))}
                </HorizontalFreeSwipe>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.slice(0, 10).map((s) => (
                    <span
                      key={s}
                      className="bg-muted text-foreground rounded-lg px-2 py-1 text-xs font-semibold"
                    >
                      {getProductSizeLabel(s)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {colorOptions.length > 0 && (
            <div>
              {/* Если есть onSelectColor — используем стандартный компонент, иначе свою горизонтальную прокрутку */}
              {onSelectColor ? (
                <div className="w-full min-w-0">
                  <ProductColorPicker
                    colors={colorOptions}
                    selected={selectedColor}
                    onSelect={onSelectColor}
                    compact
                    swipeableRow
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs font-medium">Цвет</p>
                  <HorizontalFreeSwipe spaceBetween={8}>
                    {colorOptions.map((c) => (
                      <SwiperSlide key={c} className="!w-auto">
                        {renderColorPill(c)}
                      </SwiperSlide>
                    ))}
                  </HorizontalFreeSwipe>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Description & DETAILS LINK */}
      {!!product.description && (
        <div className="bg-muted rounded-xl px-4 py-3">
          <div className="line-clamp-6 text-sm leading-tight text-foreground transition-colors">
            {product.description}
          </div>
        
            <Link className='text-sm text-indigo-500' href={ROUTES.PRODUCT(product._id)} onClick={onClose}>
              Подробнее о товаре
            </Link>
       
        </div>
      )}
    </>
  );
}
