/**
 * Product Slider Feature Module
 *
 * Полностью рефакторенная и оптимизированная карусель продуктов
 *
 * @module features/product-slider
 */

// Главный компонент
export { default as ProductSlider } from "./ui/ProductSlider";

// UI компоненты
export { default as CarouselSlide } from "./ui/CarouselSlide";
export { default as CarouselControls } from "./ui/CarouselControls";
export { default as CarouselIndicators } from "./ui/CarouselIndicators";
export { default as CarouselErrorBoundary } from "./ui/CarouselErrorBoundary";

// Custom hooks
export * from "./lib/hooks";

// Утилиты (без validateAutoplayInterval для избежания конфликта)
export {
  calculateSlideState,
  calculateSlideStyle,
  calculateSlideShadow,
  isSlideInteractive,
  calculatePreloadIndices,
  normalizeIndex,
  isValidIndex,
  validateSlides,
  createError,
  validateSlideIndex,
  isValidImageUrl,
  safeParseNumber,
  checkBrowserSupport,
  validateSlidesToShow,
} from "./lib/utils";

// Конфигурация (включает validateAutoplayInterval)
export {
  CAROUSEL_CONFIG,
  CAROUSEL_CONSTANTS,
  getSlidesToShow,
  getCurrentBreakpoint,
  validateAutoplayInterval,
} from "./model/config";

// Типы
export type {
  Slide,
  SlideState,
  SlideStyle,
  BreakpointConfig,
  TransitionConfig,
  AutoplayConfig,
  SlideStyleConfig,
  CarouselConfig,
  NavigationAction,
  BreakpointResult,
  CarouselError,
  CarouselErrorInfo,
} from "./model/types";

// Данные слайдов
export { slides } from "./model/slides.const";
