'use client';

import type { FilterState } from '@/features/product-filters';
import { InfiniteProductList } from './InfiniteProductList';
import { useEffect, useRef, useState } from 'react';

interface LazyInfiniteProductListProps {
  filters: FilterState;
  className?: string;
}

/**
 * Lazy-loaded версия InfiniteProductList
 * Загружает данные только когда пользователь прокрутит до этого раздела
 * Оптимизирует начальную загрузку страницы
 */
export const LazyInfiniteProductList: React.FC<LazyInfiniteProductListProps> = ({
  filters,
  className,
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Используем IntersectionObserver для определения, когда секция становится видимой
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !shouldLoad) {
          // Когда секция становится видимой, начинаем загрузку
          setShouldLoad(true);
          // Отключаем observer после первой загрузки
          observer.disconnect();
        }
      },
      {
        // Начинаем загрузку когда секция находится в 300px от viewport
        rootMargin: '300px',
        threshold: 0,
      },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [shouldLoad]);

  return (
    <div ref={containerRef}>
      {shouldLoad ? (
        <InfiniteProductList filters={filters} className={className} />
      ) : (
        // Показываем placeholder пока секция не видна
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-sm">Прокрутите вниз, чтобы загрузить товары</p>
        </div>
      )}
    </div>
  );
};
