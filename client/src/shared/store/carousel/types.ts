/**
 * Типы для Carousel Store
 */

/**
 * Состояние карусели
 */
export interface CarouselState {
  currentIndex: number;
  isAutoplay: boolean;
  autoplayInterval: number;
}

/**
 * Действия карусели, сгруппированные по категориям
 */
export interface CarouselActions {
  navigation: {
    setIndex: (index: number) => void;
    next: (slidesCount: number) => void;
    prev: (slidesCount: number) => void;
  };
  autoplay: {
    toggle: () => void;
    setInterval: (interval: number) => void;
  };
  reset: () => void;
}

/**
 * Полный тип Carousel Store с объектом actions
 */
export interface CarouselStore extends CarouselState {
  actions: CarouselActions;
}
