'use client';

import { useProductBanners } from '@/entities/product';
import { useCallback, useEffect, useRef, useState } from 'react';

// Массив слайдов (можно расширить)

const AUTO_PLAY_INTERVAL = 3500; // как на WB, чуть дольше
const SWIPE_THRESHOLD = 50; // px

const Slider: React.FC = () => {
  const { data: bannerImages } = useProductBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const sliderImages: { src: string; alt: string; id: string }[] =
    bannerImages?.map((url: string, index: number) => ({
      src: url,
      alt: `Слайд ${index + 1}`,
      id: `slide-${index + 1}`,
    })) || [];

  // Автоматическое переключение слайдов
  useEffect(() => {
    if (isPaused) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev === sliderImages.length - 1 ? 0 : prev + 1));
    }, AUTO_PLAY_INTERVAL);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPaused]);

  // Навигация по слайдам
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? sliderImages.length - 1 : prev - 1));
  }, [sliderImages.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === sliderImages.length - 1 ? 0 : prev + 1));
  }, [sliderImages.length]);

  // Свайп для мобильных
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = useCallback(() => {
    if (
      touchStartX.current !== null &&
      touchEndX.current !== null &&
      Math.abs(touchStartX.current - touchEndX.current) > SWIPE_THRESHOLD
    ) {
      if (touchStartX.current > touchEndX.current) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  }, [goToNext, goToPrev]);

  // Пауза при наведении мыши
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <div className="max-container m-auto flex flex-col gap-10 lg:flex-row">
      <div
        className="relative w-full max-w-[1472px] select-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-label="Слайдер баннеров"
      >
        {/* Контейнер с соотношением сторон */}
        <div
          className="relative w-full overflow-hidden rounded-3xl shadow-lg"
          style={{ paddingTop: '40.76%' }} // 600/1472*100%
        >
          {sliderImages.map((img: { src: string; alt: string; id: string }, idx: number) => (
            <div
              key={img.id}
              className={`absolute top-0 left-0 h-full w-full transition-all duration-700 ease-in-out ${idx === currentIndex ? 'z-10 scale-100 opacity-100' : 'z-0 scale-95 opacity-0'} `}
              style={{
                pointerEvents: idx === currentIndex ? 'auto' : 'none',
                transitionProperty: 'opacity, transform',
              }}
            >
              <img
                src={img.src}
                alt={img.alt}
                draggable={false}
                loading={idx === 0 ? 'eager' : 'lazy'}
                sizes="(max-width: 1472px) 100vw, 1472px"
                className="h-full w-full rounded-3xl object-cover select-none"
                style={{
                  boxShadow: idx === currentIndex ? '0 8px 32px 0 rgba(0,0,0,0.10)' : 'none',
                  transition: 'box-shadow 0.3s',
                }}
              />
            </div>
          ))}
        </div>
        {/* Кнопки навигации */}
        <button
          type="button"
          aria-label="Предыдущий слайд"
          className="bg-opacity-80 hover:bg-opacity-100 absolute top-1/2 left-4 z-20 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-3 shadow-lg transition outline-none"
          onClick={goToPrev}
          tabIndex={0}
        >
          <span className="text-3xl font-bold text-gray-700">{'‹'}</span>
        </button>
        <button
          type="button"
          aria-label="Следующий слайд"
          className="bg-opacity-80 hover:bg-opacity-100 absolute top-1/2 right-4 z-20 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-3 shadow-lg transition outline-none"
          onClick={goToNext}
          tabIndex={0}
        >
          <span className="text-3xl font-bold text-gray-700">{'›'}</span>
        </button>
        {/* Индикаторы */}
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {sliderImages.map((img, idx) => (
            <button
              type="button"
              key={`${img.id}-indicator`}
              aria-label={`Перейти к слайду ${idx + 1}`}
              className={`h-4 w-4 rounded-full border-2 border-white shadow transition-all outline-none ${idx === currentIndex ? 'bg-primary scale-110' : 'hover:bg-primary/60 bg-gray-300'} `}
              style={{
                boxShadow: idx === currentIndex ? '0 0 0 2px var(--primary-foreground)' : 'none',
                transition: 'background 0.2s, transform 0.2s',
              }}
              onClick={() => setCurrentIndex(idx)}
              tabIndex={0}
            />
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-[665px] flex-col gap-4">
        {(bannerImages || []).slice(0, 2).map((imgUrl: string, i: number) => (
          <div
            key={`banner-${i}`}
            className="group relative h-[180px] w-full overflow-hidden rounded-3xl shadow-lg md:h-[271px]"
            aria-label={`Баннер ${i + 1}`}
          >
            <img
              src={imgUrl}
              alt={`Баннер ${i + 1}`}
              draggable={false}
              loading={i === 0 ? 'eager' : 'lazy'}
              sizes="(max-width: 665px) 100vw, 665px"
              className="absolute top-0 left-0 h-full w-full rounded-3xl object-cover transition-transform duration-500 select-none group-hover:scale-105"
            />
            {/* Эффект затемнения при наведении */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gray-900/0 transition-colors duration-300 group-hover:bg-gray-900/10" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Slider;
