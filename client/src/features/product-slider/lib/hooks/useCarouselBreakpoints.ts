import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { getSlidesToShow, getCurrentBreakpoint, CAROUSEL_CONSTANTS } from "../../model/config";
import type { BreakpointResult } from "../../model/types";

/**
 * Hook для отслеживания breakpoints и вычисления количества видимых слайдов
 *
 * @returns {BreakpointResult & { mounted: boolean }} Текущий breakpoint, количество слайдов и состояние монтирования
 *
 * @example
 * const { slidesToShow, currentBreakpoint, mounted } = useCarouselBreakpoints();
 */
export const useCarouselBreakpoints = (): BreakpointResult & { mounted: boolean } => {
  const [mounted, setMounted] = useState(false);
  const [slidesToShow, setSlidesToShow] = useState(1); // SSR-safe начальное значение
  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<BreakpointResult["currentBreakpoint"]>("mobile");

  // Обновление breakpoint и slidesToShow
  const updateBreakpoint = useCallback(() => {
    if (typeof window === "undefined") return;

    const width = window.innerWidth;
    const newSlidesToShow = getSlidesToShow(width);
    const newBreakpoint = getCurrentBreakpoint(width);

    setSlidesToShow((prev) => (prev !== newSlidesToShow ? newSlidesToShow : prev));
    setCurrentBreakpoint((prev) => (prev !== newBreakpoint ? newBreakpoint : prev));
  }, []);

  // Монтирование и начальная установка
  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      updateBreakpoint(); // Установить корректные значения после монтирования
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [updateBreakpoint]);

  // Resize listener с debounce через requestAnimationFrame
  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      // Отменяем предыдущие вызовы
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      // Debounce с использованием RAF для плавности
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          updateBreakpoint();
        });
      }, CAROUSEL_CONSTANTS.RESIZE_DEBOUNCE);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [updateBreakpoint]);

  return {
    slidesToShow,
    currentBreakpoint,
    mounted,
  };
};
