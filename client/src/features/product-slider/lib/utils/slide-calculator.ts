import type { SlideState, SlideStyle } from "../../model/types";
import { CAROUSEL_CONFIG, CAROUSEL_CONSTANTS } from "../../model/config";

/**
 * Вычисляет состояние слайда (центральный, видимый, скрытый)
 */
export const calculateSlideState = (
  slideIndex: number,
  currentIndex: number,
  totalSlides: number,
  slidesToShow: number,
): SlideState => {
  // Если только один слайд
  if (totalSlides === 1) {
    return { isCenter: true, isVisible: true, isAdjacent: false };
  }

  // Если показываем только один слайд за раз
  if (slidesToShow === 1) {
    const isCenter = slideIndex === currentIndex;
    return {
      isCenter,
      isVisible: isCenter,
      isAdjacent: false,
    };
  }

  // Вычисляем видимые индексы с центрированием на currentIndex
  const half = Math.floor(slidesToShow / 2);
  const visibleIndices: number[] = [];

  for (let i = -half; i <= half; i++) {
    const index = (currentIndex + i + totalSlides) % totalSlides;
    visibleIndices.push(index);
  }

  const isVisible = visibleIndices.includes(slideIndex);
  const centerIndex = visibleIndices[Math.floor(visibleIndices.length / 2)];
  const isCenter = slideIndex === centerIndex;

  // Проверяем, является ли слайд соседним с центральным
  const isAdjacent =
    isVisible &&
    !isCenter &&
    (slideIndex === (centerIndex - 1 + totalSlides) % totalSlides ||
      slideIndex === (centerIndex + 1) % totalSlides);

  return { isCenter, isVisible, isAdjacent };
};

/**
 * Вычисляет стили для слайда на основе его состояния
 */
export const calculateSlideStyle = (state: SlideState): SlideStyle => {
  const { slideStyles } = CAROUSEL_CONFIG;
  const { HIDDEN_SLIDE_BLUR } = CAROUSEL_CONSTANTS;

  if (!state.isVisible) {
    return {
      transform: `scale(${slideStyles.hidden.scale})`,
      opacity: slideStyles.hidden.opacity,
      zIndex: slideStyles.hidden.zIndex,
      filter: `blur(${HIDDEN_SLIDE_BLUR}px)`,
    };
  }

  if (state.isCenter) {
    return {
      transform: `scale(${slideStyles.center.scale})`,
      opacity: slideStyles.center.opacity,
      zIndex: slideStyles.center.zIndex,
      filter: "none",
    };
  }

  return {
    transform: `scale(${slideStyles.visible.scale})`,
    opacity: slideStyles.visible.opacity,
    zIndex: slideStyles.visible.zIndex,
    filter: "none",
  };
};

/**
 * Вычисляет box-shadow для слайда
 */
export const calculateSlideShadow = (state: SlideState): string => {
  const { CENTER_SLIDE_SHADOW, VISIBLE_SLIDE_SHADOW } = CAROUSEL_CONSTANTS;

  if (state.isCenter) {
    return CENTER_SLIDE_SHADOW;
  }

  return VISIBLE_SLIDE_SHADOW;
};

/**
 * Проверяет, должен ли слайд быть интерактивным
 */
export const isSlideInteractive = (state: SlideState): boolean => {
  return state.isVisible;
};

/**
 * Вычисляет индексы слайдов для preload
 */
export const calculatePreloadIndices = (
  currentIndex: number,
  totalSlides: number,
  count: number = CAROUSEL_CONSTANTS.PRELOAD_ADJACENT_COUNT,
): number[] => {
  if (totalSlides <= 1) return [];

  const indices: number[] = [];

  for (let i = 1; i <= count; i++) {
    // Следующие слайды
    indices.push((currentIndex + i) % totalSlides);
    // Предыдущие слайды
    indices.push((currentIndex - i + totalSlides) % totalSlides);
  }

  return indices;
};

/**
 * Безопасное вычисление индекса с wraparound
 */
export const normalizeIndex = (index: number, totalSlides: number): number => {
  if (totalSlides <= 0) return 0;
  return ((index % totalSlides) + totalSlides) % totalSlides;
};

/**
 * Проверяет валидность индекса
 */
export const isValidIndex = (index: number, totalSlides: number): boolean => {
  return Number.isFinite(index) && index >= 0 && index < totalSlides;
};
