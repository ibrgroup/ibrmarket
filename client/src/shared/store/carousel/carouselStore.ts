import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type { CarouselState, CarouselStore } from './types';

/**
 * Начальное состояние карусели
 */
const INITIAL_STATE: CarouselState = {
  currentIndex: 0,
  isAutoplay: true,
  autoplayInterval: 4000,
};

/**
 * Store для управления каруселью
 * - currentIndex: текущий индекс слайда
 * - isAutoplay: включено ли автопроигрывание
 * - autoplayInterval: интервал автопроигрывания в миллисекундах
 */
export const useCarouselStore = create<CarouselStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        ...INITIAL_STATE,

        // Actions
        actions: {
          navigation: {
            setIndex: (index: number) => {
              // Валидация: игнорируем NaN и отрицательные значения
              if (!Number.isFinite(index) || index < 0) {
                console.warn('[CarouselStore] Invalid index:', index);
                return;
              }

              const { currentIndex } = get();
              if (currentIndex !== index) {
                set({ currentIndex: index }, false, 'carousel/navigation/setIndex');
              }
            },

            next: (slidesCount: number) => {
              // Валидация количества слайдов
              if (!Number.isFinite(slidesCount) || slidesCount <= 0) {
                console.warn('[CarouselStore] Invalid slidesCount:', slidesCount);
                return;
              }

              const { currentIndex } = get();
              const nextIndex = (currentIndex + 1) % slidesCount;
              set({ currentIndex: nextIndex }, false, 'carousel/navigation/next');
            },

            prev: (slidesCount: number) => {
              // Валидация количества слайдов
              if (!Number.isFinite(slidesCount) || slidesCount <= 0) {
                console.warn('[CarouselStore] Invalid slidesCount:', slidesCount);
                return;
              }

              const { currentIndex } = get();
              const prevIndex = (currentIndex - 1 + slidesCount) % slidesCount;
              set({ currentIndex: prevIndex }, false, 'carousel/navigation/prev');
            },
          },
          autoplay: {
            toggle: () => {
              set(state => ({ isAutoplay: !state.isAutoplay }), false, 'carousel/autoplay/toggle');
            },
            setInterval: (interval: number) => {
              // Валидация: минимум 200ms для предотвращения проблем производительности
              if (!Number.isFinite(interval) || interval < 200) {
                console.warn('[CarouselStore] Invalid interval (min 200ms):', interval);
                return;
              }

              set({ autoplayInterval: interval }, false, 'carousel/autoplay/setInterval');
            },
          },
          reset: () => {
            set(INITIAL_STATE, false, 'carousel/reset');
          },
        },
      }),
      {
        name: 'product-slider-storage',
        // Персистим только preferences, не runtime state
        partialize: state => ({
          isAutoplay: state.isAutoplay,
          autoplayInterval: state.autoplayInterval,
        }),
      }
    ),
    {
      name: 'CarouselStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
