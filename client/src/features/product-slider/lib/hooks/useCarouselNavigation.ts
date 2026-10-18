import { useCallback } from "react";
import type { CarouselApi } from "@/shared/ui/carousel";
import { normalizeIndex } from "../utils/slide-calculator";

/**
 * Hook для навигации по карусели (DRY для prev/next/goto)
 *
 * Важно: Этот hook НЕ обновляет store напрямую.
 * Store обновляется через useCarouselSync при событии 'select' от Embla.
 * Это предотвращает циклические обновления.
 *
 * @param api - Embla Carousel API instance
 * @param totalSlides - Общее количество слайдов
 * @returns Навигационные функции
 *
 * @example
 * const { handlePrev, handleNext, handleGoTo } = useCarouselNavigation(api, slides.length);
 */
export const useCarouselNavigation = (api: CarouselApi | null, totalSlides: number) => {
  /**
   * Переход к предыдущему слайду
   */
  const handlePrev = useCallback(() => {
    if (!api || totalSlides <= 0) return;

    try {
      api.scrollPrev();
    } catch (error) {
      console.error("[Navigation] Error in handlePrev:", error);
    }
  }, [api, totalSlides]);

  /**
   * Переход к следующему слайду
   */
  const handleNext = useCallback(() => {
    if (!api || totalSlides <= 0) return;

    try {
      api.scrollNext();
    } catch (error) {
      console.error("[Navigation] Error in handleNext:", error);
    }
  }, [api, totalSlides]);

  /**
   * Переход к конкретному слайду
   */
  const handleGoTo = useCallback(
    (index: number) => {
      if (!api || totalSlides <= 0) return;

      // Валидация индекса
      if (!Number.isFinite(index)) {
        console.warn("[Navigation] Invalid index:", index);
        return;
      }

      // Нормализация индекса
      const safeIndex = normalizeIndex(index, totalSlides);

      try {
        api.scrollTo(safeIndex);
      } catch (error) {
        console.error("[Navigation] Error in handleGoTo:", error);
      }
    },
    [api, totalSlides],
  );

  /**
   * Проверка возможности навигации
   */
  const canNavigate = useCallback(() => {
    return api !== null && totalSlides > 1;
  }, [api, totalSlides]);

  return {
    handlePrev,
    handleNext,
    handleGoTo,
    canNavigate,
  };
};
