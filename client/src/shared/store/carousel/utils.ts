import { useCarouselStore } from './carouselStore';
import type { CarouselStore } from './types';

/**
 * Утилиты для работы с Carousel Store вне React компонентов
 */

/**
 * Получить текущее состояние карусели вне React компонента
 */
export const getCarouselState = (): CarouselStore => {
  return useCarouselStore.getState();
};

/**
 * Подписаться на изменения состояния карусели вне React компонента
 */
export const subscribeToCarousel = (callback: (state: CarouselStore) => void) => {
  return useCarouselStore.subscribe(callback);
};
