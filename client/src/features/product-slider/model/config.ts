import type { CarouselConfig } from './types';

/**
 * Дефолтная конфигурация карусели
 */
export const CAROUSEL_CONFIG: CarouselConfig = {
  // Breakpoints для responsive поведения
  breakpoints: {
    mobile: 768,
    tablet: 1200,
    desktop: 1920,
  },

  // Transitions для анимаций
  transitions: {
    default: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    smooth: 'all 0.3s ease-in-out',
    fast: 'all 0.2s ease-out',
  },

  // Настройки автопроигрывания
  autoplay: {
    enabled: true,
    interval: 4000,
    pauseOnHover: true,
    pauseOnFocus: true,
  },

  // Стили для разных состояний слайдов
  slideStyles: {
    center: {
      scale: 1.08,
      opacity: 1,
      zIndex: 4,
    },
    visible: {
      scale: 0.96,
      opacity: 0.85,
      zIndex: 2,
    },
    hidden: {
      scale: 0.88,
      opacity: 0.5,
      zIndex: 1,
    },
  },

  // Accessibility настройки
  accessibility: {
    announceSlideChange: true,
    announceAutoplay: true,
  },
};

/**
 * Константы для карусели
 */
export const CAROUSEL_CONSTANTS = {
  // Минимальное количество слайдов для навигации
  MIN_SLIDES_FOR_NAVIGATION: 2,

  // Debounce для resize listener (ms)
  RESIZE_DEBOUNCE: 150,

  // Минимальный интервал автопроигрывания (ms)
  MIN_AUTOPLAY_INTERVAL: 200,

  // Задержка для skeleton loader (ms)
  SKELETON_DELAY: 300,

  // Количество слайдов для preload
  PRELOAD_ADJACENT_COUNT: 1,

  // Blur для hidden слайдов (px)
  HIDDEN_SLIDE_BLUR: 1,

  // Shadow для центрального слайда
  CENTER_SLIDE_SHADOW: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',

  // Shadow для видимых слайдов
  VISIBLE_SLIDE_SHADOW: '0 4px 6px -1px rgba(0, 0, 0, 0.06)',

  // Border radius для слайдов (px)
  SLIDE_BORDER_RADIUS: 12,
} as const;

/**
 * Функция для расчета количества слайдов на основе ширины окна
 */
export const getSlidesToShow = (width: number): number => {
  const { breakpoints } = CAROUSEL_CONFIG;

  if (width >= breakpoints.desktop) return 3;
  if (width >= breakpoints.tablet) return 3;
  if (width >= breakpoints.mobile) return 2;
  return 1;
};

/**
 * Функция для получения текущего breakpoint
 */
export const getCurrentBreakpoint = (
  width: number
): keyof typeof CAROUSEL_CONFIG.breakpoints | 'mobile' => {
  const { breakpoints } = CAROUSEL_CONFIG;

  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  if (width >= breakpoints.mobile) return 'mobile';
  return 'mobile';
};

/**
 * Валидация интервала автопроигрывания
 */
export const validateAutoplayInterval = (interval: number): number => {
  return Math.max(interval, CAROUSEL_CONSTANTS.MIN_AUTOPLAY_INTERVAL);
};
