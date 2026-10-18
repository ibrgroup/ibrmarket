'use client';

import type { Product } from '@/entities/product';
import { getProductImage } from '@/entities/product/lib/utils';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface ProductGalleryProps {
  product: Product;
  productId: string;
  discountPercent: number;
  onImageError?: (index: number) => void;
}

/**
 * Оптимизированная галерея изображений товара
 * Рендерит только видимые и соседние изображения для производительности
 * Стрелки навигации появляются только при наведении на область изображения
 */
export function ProductGallery({
  product,
  productId,
  discountPercent,
  onImageError,
}: ProductGalleryProps) {
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
      onImageError?.(index);
    },
    [onImageError],
  );

  // Навигация по изображениям
  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);


  useEffect(() => {
    setCurrentImageIndex(0);
    setImageErrors(new Set());
  }, [productId]);

  // Keyboard navigation
  useEffect(() => {
    if (images.length <= 1) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Проверяем, что фокус находится внутри галереи
      const gallery = document.querySelector('[data-gallery]');
      if (!gallery || !gallery.contains(document.activeElement)) return;

      // Предотвращаем навигацию только для стрелок, если не в input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
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
  const visibleImageIndices = useMemo(() => {
    const indices = new Set<number>();
    indices.add(currentImageIndex);
    if (currentImageIndex > 0) indices.add(currentImageIndex - 1);
    if (currentImageIndex < images.length - 1) indices.add(currentImageIndex + 1);
    return Array.from(indices);
  }, [currentImageIndex, images.length]);

  return (
    <div className="bg-muted relative flex w-full flex-shrink-0 flex-col h-full lg:w-[50%] lg:min-w-[380px]">
      {/* Main Image Container */}
      <div
        data-gallery
        className="group bg-card relative flex-1 w-full overflow-hidden min-h-0"
        role="region"
        aria-label="Галерея изображений товара"
        tabIndex={0}
      >
        {/* Рендерим только видимые изображения для оптимизации */}
        {visibleImageIndices.map((index) => {
          const hasError = imageErrors.has(index);
          return (
            <div
              key={`${productId}-${index}`}
              className={cn(
                'absolute inset-0 transition-opacity duration-500 ease-in-out',
                index === currentImageIndex
                  ? 'opacity-100 z-10'
                  : 'opacity-0 z-0 pointer-events-none',
              )}
            >
              {hasError ? (
                <div className="bg-muted flex h-full w-full items-center justify-center">
                  <div className="text-muted-foreground text-center">
                    <p className="text-sm">Изображение не загружено</p>
                  </div>
                </div>
              ) : (
                <Image
                  src={images[index]}
                  alt={`${product.name} - изображение ${index + 1} из ${images.length}`}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={index === 0}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  onError={() => handleImageError(index)}
                />
              )}
            </div>
          );
        })}

        {discountPercent > 0 && (
          <Badge
            className="bg-pink-500 text-destructive-foreground text-white absolute top-4 left-4 px-3 py-1.5 text-sm font-bold shadow-lg z-30"
            style={{ borderRadius: '12px' }}
            aria-label={`Скидка ${discountPercent} процентов`}
          >
            -{discountPercent}%
          </Badge>
        )}

        {images.length > 1 && (
          <>
            {/* Контейнер для стрелок: скрыт по умолчанию, появляется при наведении на .group */}
            <div className="absolute inset-0 z-20 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto">
              <button
                onClick={handlePrevImage}
                className="bg-white/95 cursor-pointer outline-none hover:bg-white dark:bg-zinc-900/95 dark:hover:bg-zinc-900 absolute top-1/2 left-2 z-30 -translate-y-1/2 rounded-full p-2.5 shadow-lg transition-all duration-200 ease-out"
                aria-label="Предыдущее изображение"
                type="button"
              >
                <ChevronLeft className="text-gray-900 dark:text-zinc-100 h-5 w-5" />
              </button>
              <button
                onClick={handleNextImage}
                className="bg-white/95 cursor-pointer outline-none hover:bg-white dark:bg-zinc-900/95 dark:hover:bg-zinc-900 absolute top-1/2 right-2 z-30 -translate-y-1/2 rounded-full p-2.5 transition-all duration-200 ease-out"
                aria-label="Следующее изображение"
                type="button"
              >
                <ChevronRight className="text-gray-900 dark:text-zinc-100 h-5 w-5" />
              </button>
            </div>

            {/* Gallery Counter */}
            <div
              className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-white text-xs font-semibold shadow-lg"
              aria-live="polite"
              aria-atomic="true"
            >
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails (раскомментировано для удобства, логика не менялась) */}
      {/* {images.length > 1 && (
        <div
          className="bg-muted border-border flex gap-3 overflow-x-auto border-t p-3 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40"
          style={{ scrollbarWidth: 'thin' }}
        >
          {images.map((img, index) => {
            const hasError = imageErrors.has(index);
            return (
              <button
                key={`thumb-${productId}-${index}`}
                onClick={() => handleImageSelect(index)}
                className={cn(
                  'relative flex-shrink-0 h-16 w-16 overflow-hidden rounded-lg cursor-pointer transition-all',
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
                  <Image
                    src={img}
                    alt={`Миниатюра ${index + 1}`}
                    fill
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
      )} */}
    </div>
  );
}