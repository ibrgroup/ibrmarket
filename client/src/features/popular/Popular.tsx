'use client';

import { Category, useCategories } from '@/entities/category';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FC, KeyboardEvent, useCallback, useMemo, useRef } from 'react';
import 'swiper/css';
import 'swiper/css/free-mode';
import { FreeMode, Mousewheel } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

interface CategoryWithGradient {
  image: string;
  title: string;
  gradient: string;
  className: string; // исправлено (было classNames)
}

// Массив с изображениями и названиями
const categoriesImages: CategoryWithGradient[] = [
  {
    image: 'https://ibrgroup.ru/partnership.webp',
    title: 'Плати Частями',
    gradient: 'linear-gradient(135deg, #041121, #041121)',
    className: 'ml-4',
  },
  {
    image: './home.webp',
    title: 'Купи Продай ',
    gradient: 'linear-gradient(135deg, #7dfffb, #3853ff)',
    className: 'ml-1',
  },
  {
    image: './скидка.png',
    title: 'Скидки Продажи ',
    gradient: 'linear-gradient(135deg, #ff9a15, #ff00fb)',
    className: 'ml-1',
  },
  {
    image: 'https://ibrgroup.ru/6998fb5e4ce7086d267ea7a1.webp',
    title: 'Стань Партнером ',
    gradient: 'linear-gradient(135deg, #89F7FE, #66A6FF)',
    className: 'ml-1',
  },

  {
    image: './itdigital.png',
    title: 'Откройте ibrmarket',
    gradient: 'linear-gradient(135deg, #1544ff, #15ffd4)',
    className: 'ml-1',
  },
];

// Компонент для отображения карточки категории
const CategoryItem: FC<{
  src: string;
  alt: string;
  title: string;
  gradient: string;
  className?: string;
}> = ({ src, alt, title, gradient, className = '' }) => (
  <div className="flex flex-col items-center">
    <div
      className={`relative p-1 overflow-hidden w-13 h-13 rounded-2xl flex items-center justify-center ${className}`}
      style={{ background: gradient }}
    >
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover`}
        loading="lazy"
      />
    </div>
    <p className={`text-xs font-medium leading-3 text-center mt-1 max-w-[60px] break-words ${className}`}>
      {title}
    </p>
  </div>
);

// Лоадеры и ошибки
const SkeletonLoader = () => (
  <div className="flex items-center justify-center ">
    <Skeleton className="h-28 w-28 rounded-2xl" />
  </div>
);

const EmptyState: FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] text-center gap-4 py-8 w-full">
    <div className="text-muted-foreground">
      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p className="font-medium text-lg mb-1">Категории не найдены</p>
      <p className="text-sm">Популярные категории появятся здесь позже</p>
    </div>
    <Button variant="outline" size="sm" onClick={onRetry}>
      <RefreshCw className="mr-2 h-4 w-4" />
      Обновить
    </Button>
  </div>
);

const ErrorState: FC<{ error: unknown; onRetry: () => void }> = ({ error, onRetry }) => {
  let errorMessage = 'Неизвестная ошибка';
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Error).message === 'string'
  ) {
    errorMessage = (error as Error).message;
  }
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-2 flex-wrap">
        <span>Ошибка загрузки категорий: {errorMessage}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Повторить
        </Button>
      </AlertDescription>
    </Alert>
  );
};

// Основной компонент
const Popular: FC = () => {
  const router = useRouter();
  const { data: categories, error, refetch } = useCategories();
  // const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const swiperRef = useRef<any>(null);

  // Фильтрация категорий
  const displayCategories = useMemo(
    () =>
      (categories || [])
        .filter(
          (cat): cat is Category =>
            !!cat &&
            typeof cat === 'object' &&
            '_id' in cat &&
            'name' in cat &&
            typeof cat.name === 'string' &&
            cat.name.trim() !== '',
        )
        .slice(0, 5), // Ограничение 5 элементов
    [categories],
  );

  const handleCategoryClick = useCallback(
    (category: { name: string; _id: string }) => {
      const slug = category.name.toLowerCase().trim().replace(/\s+/g, '-');
      router.push(`/products?category=${encodeURIComponent(slug)}`);
    },
    [router],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>, category: { name: string; _id: string }) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCategoryClick(category);
      }
    },
    [handleCategoryClick],
  );

  const handleSlideChange = () => {
    // логика при смене слайда
  };

  if (error) {
    return (
      <section className="max-container m-auto mt-6" aria-live="assertive">
        <div className="container px-1">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      </section>
    );
  }

  if (categories && displayCategories.length === 0) {
    return (
      <section className="max-container m-auto mt-6" aria-live="polite">
        <div className="container px-1">
          <EmptyState onRetry={refetch} />
        </div>
      </section>
    );
  }

  return (
    <section className="block sm:hidden" aria-busy={!categories} aria-live="polite">
      <div className="overflow-hidden">
        {categories && displayCategories.length > 0 && (
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {displayCategories.length} {displayCategories.length === 1 ? 'категория' : 'категорий'}
          </div>
        )}

        <div className="py-2">
          {!categories ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonLoader key={`skeleton-${i}`} />)
          ) : (
            <Swiper
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              onSlideChange={handleSlideChange}
              modules={[FreeMode, Mousewheel]}
              freeMode={{
                enabled: true,
                momentum: true,
                momentumBounceRatio: 0.3,
              }}
              mousewheel={{
                forceToAxis: true,
                sensitivity: 1,
              }}
              slidesPerView="auto"
              spaceBetween={12}
              breakpoints={{
                640: { spaceBetween: 14 },
                768: { spaceBetween: 16 },
                1024: { spaceBetween: 18 },
              }}
            >
              {displayCategories.map((category, index) => {
                const catImage = categoriesImages[index % categoriesImages.length];
                return (
                  <SwiperSlide key={category._id} className="!w-auto ">
                    <button
                      type="button"
                      className="h-full cursor-pointer flex flex-col items-center"
                      onClick={() => handleCategoryClick(category)}
                      onKeyDown={(e) => handleKeyDown(e, category)}
                      aria-label={`Перейти к категории ${category.name}`}
                    >
                      <CategoryItem
                        src={catImage.image}
                        alt={catImage.title}
                        title={catImage.title}
                        gradient={catImage.gradient}
                        className={catImage.className} // исправлено
                      />
                    </button>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          )}
        </div>
      </div>
    </section>
  );
};

export default Popular;
