import { useEffect, useRef } from "react";
import type { CarouselApi } from "@/shared/ui/carousel";
import { useCarouselStore } from '@/shared/store/carousel';

/**
 * Hook для управления автопроигрыванием карусели
 *
 * @param api - Embla Carousel API instance
 * @param totalSlides - Общее количество слайдов
 * @param isPaused - Внешнее состояние паузы (например, hover)
 *
 * @example
 * const [isHovered, setIsHovered] = useState(false);
 * useCarouselAutoplay(api, slides.length, isHovered);
 */
export const useCarouselAutoplay = (
  api: CarouselApi | null,
  totalSlides: number,
  isPaused: boolean = false,
) => {
  // Подписываемся только на autoplay настройки, не на currentIndex
  const isAutoplay = useCarouselStore((state) => state.isAutoplay);
  const interval = useCarouselStore((state) => state.autoplayInterval);

  const intervalRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Track mount state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Autoplay logic
  useEffect(() => {
    // Очистка предыдущего интервала
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Проверки перед запуском autoplay
    if (!api) return;
    if (!isAutoplay) return;
    if (isPaused) return;
    if (totalSlides <= 1) return;

    // Запуск autoplay
    intervalRef.current = window.setInterval(() => {
      if (!mountedRef.current) return;

      // Используем scrollNext напрямую без обновления store
      // Store обновится через useCarouselSync при событии 'select'
      try {
        if (api.canScrollNext()) {
          api.scrollNext();
        } else {
          // Если достигли конца, перематываем в начало (для loop: true)
          api.scrollTo(0);
        }
      } catch (error) {
        console.error("[CarouselAutoplay] Error during scroll:", error);
      }
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [api, isAutoplay, interval, isPaused, totalSlides]);

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);
};
