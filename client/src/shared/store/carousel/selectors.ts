import type { CarouselStore } from './types';

/**
 * Селекторы для Carousel Store
 * Используйте эти селекторы для оптимизации производительности
 */
export const carouselSelectors = {
  // State
  currentIndex: (state: CarouselStore) => state.currentIndex,
  isAutoplay: (state: CarouselStore) => state.isAutoplay,
  autoplayInterval: (state: CarouselStore) => state.autoplayInterval,

  // Actions
  actions: (state: CarouselStore) => state.actions,
  navigationActions: (state: CarouselStore) => state.actions.navigation,
  autoplayActions: (state: CarouselStore) => state.actions.autoplay,

  // Combined selectors
  navigation: (state: CarouselStore) => ({
    currentIndex: state.currentIndex,
    actions: state.actions.navigation,
  }),
  autoplay: (state: CarouselStore) => ({
    isAutoplay: state.isAutoplay,
    interval: state.autoplayInterval,
    actions: state.actions.autoplay,
  }),
};
