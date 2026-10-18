/**
 * Carousel Store Module
 * Публичный API для работы с состоянием карусели
 */

// Store
export { useCarouselStore } from './carouselStore';

// Types
export type { CarouselState, CarouselActions, CarouselStore } from './types';

// Selectors
export { carouselSelectors } from './selectors';

// Hooks
export {
  useCarouselIndex,
  useCarouselNavigation,
  useCarouselAutoplay,
  useCarouselActions,
  useCarouselState,
} from './hooks';

// Utils
export { getCarouselState, subscribeToCarousel } from './utils';
