import type { Slide, CarouselErrorInfo } from "../../model/types";

/**
 * Валидирует массив слайдов
 */
export const validateSlides = (slides: unknown): slides is Slide[] => {
  if (!Array.isArray(slides)) {
    return false;
  }

  if (slides.length === 0) {
    return false;
  }

  return slides.every((slide) => {
    return (
      typeof slide === "object" &&
      slide !== null &&
      "id" in slide &&
      "image" in slide &&
      "title" in slide &&
      "priceCurrent" in slide &&
      typeof slide.id === "number" &&
      typeof slide.image === "string" &&
      typeof slide.title === "string" &&
      typeof slide.priceCurrent === "string" &&
      slide.image.length > 0
    );
  });
};

/**
 * Создает информацию об ошибке
 */
export const createError = (
  type: CarouselErrorInfo["type"],
  message: string,
  recoverable: boolean = false,
): CarouselErrorInfo => {
  return { type, message, recoverable };
};

/**
 * Валидирует индекс слайда
 */
export const validateSlideIndex = (index: number, totalSlides: number): boolean => {
  return Number.isFinite(index) && index >= 0 && index < totalSlides;
};

/**
 * Валидирует интервал автопроигрывания
 */
export const validateAutoplayInterval = (interval: number): boolean => {
  return Number.isFinite(interval) && interval >= 200;
};

/**
 * Валидирует количество слайдов для показа
 */
export const validateSlidesToShow = (count: number): boolean => {
  return Number.isFinite(count) && count > 0 && Number.isInteger(count);
};

/**
 * Проверяет, является ли URL изображения валидным
 */
export const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Безопасно парсит число
 */
export const safeParseNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Проверяет, поддерживается ли API браузера
 */
export const checkBrowserSupport = () => {
  return {
    intersectionObserver: typeof IntersectionObserver !== "undefined",
    resizeObserver: typeof ResizeObserver !== "undefined",
    requestAnimationFrame: typeof requestAnimationFrame !== "undefined",
    vibrate: "vibrate" in navigator,
  };
};
