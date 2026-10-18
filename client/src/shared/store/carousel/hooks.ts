import { useShallow } from 'zustand/react/shallow';

import { useCarouselStore } from './carouselStore';
import { carouselSelectors } from './selectors';

/**
 * Хуки для работы с Carousel Store
 * Предоставляют удобные способы доступа к состоянию и действиям
 */

/**
 * Хук для получения текущего индекса карусели
 */
export const useCarouselIndex = () => {
  return useCarouselStore(carouselSelectors.currentIndex);
};

/**
 * Хук для работы с навигацией карусели
 */
export const useCarouselNavigation = () => {
  return useCarouselStore(carouselSelectors.navigation);
};

/**
 * Хук для работы с autoplay карусели
 */
export const useCarouselAutoplay = () => {
  return useCarouselStore(carouselSelectors.autoplay);
};

/**
 * Хук для получения всех действий карусели
 */
export const useCarouselActions = () => {
  return useCarouselStore(carouselSelectors.actions);
};

/**
 * Хук для получения всего состояния карусели (оптимизирован с useShallow)
 */
export const useCarouselState = () => {
  return useCarouselStore(
    useShallow(state => ({
      currentIndex: state.currentIndex,
      isAutoplay: state.isAutoplay,
      autoplayInterval: state.autoplayInterval,
      actions: state.actions,
    }))
  );
};
