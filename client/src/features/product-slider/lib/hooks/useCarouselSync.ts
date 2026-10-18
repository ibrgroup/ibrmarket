import { useEffect, useRef } from 'react';
import type { CarouselApi } from '@/shared/ui/carousel';
import { useCarouselStore } from '@/shared/store/carousel';

/**
 * Hook для синхронизации состояния Store с Embla Carousel API
 *
 * ВАЖНО: Этот hook является единственным источником обновлений store.currentIndex
 * Все изменения слайдов происходят через Embla API, а этот hook
 * слушает события 'select' и обновляет store соответственно.
 *
 * Это предотвращает циклические обновления и гарантирует
 * что Embla API является единственным источником истины.
 *
 * @param api - Embla Carousel API instance
 * @param totalSlides - Общее количество слайдов
 *
 * @example
 * const [api, setApi] = useState<CarouselApi | null>(null);
 * useCarouselSync(api, slides.length);
 */
export const useCarouselSync = (api: CarouselApi | null, totalSlides: number) => {
  const setIndex = useCarouselStore(state => state.actions.navigation.setIndex);
  const isReadyRef = useRef(false);

  // Инициализация Embla
  useEffect(() => {
    if (!api) return;

    const handleInit = () => {
      isReadyRef.current = true;
      // Синхронизируем начальное состояние
      const initialIndex = api.selectedScrollSnap();
      if (Number.isFinite(initialIndex)) {
        setIndex(initialIndex);
      }
    };

    api.on('init', handleInit);

    return () => {
      api.off('init', handleInit);
      isReadyRef.current = false;
    };
  }, [api, setIndex]);

  // Синхронизация Embla -> Store (ЕДИНСТВЕННОЕ направление)
  useEffect(() => {
    if (!api || !isReadyRef.current) return;

    const handleSelect = () => {
      const selectedIndex = api.selectedScrollSnap();

      // Проверка валидности индекса
      if (!Number.isFinite(selectedIndex)) return;
      if (selectedIndex < 0 || selectedIndex >= totalSlides) return;

      // Обновляем store
      setIndex(selectedIndex);
    };

    api.on('select', handleSelect);

    return () => {
      api.off('select', handleSelect);
    };
  }, [api, setIndex, totalSlides]);
};
