import { useCarouselStore } from '@/shared/store/carousel';
import { useCallback } from 'react';

/**
 * Hook для обработки клавиатурной навигации и accessibility
 *
 * @param onPrev - Функция для перехода к предыдущему слайду
 * @param onNext - Функция для перехода к следующему слайду
 * @returns Обработчик клавиатурных событий
 *
 * @example
 * const handleKeyDown = useCarouselKeyboard(handlePrev, handleNext);
 * <div onKeyDown={handleKeyDown} tabIndex={0}>...</div>
 */
export const useCarouselKeyboard = (onPrev: () => void, onNext: () => void) => {
  const toggleAutoplay = useCarouselStore((state) => state.actions.autoplay.toggle);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { key } = event;

      switch (key) {
        case 'ArrowLeft':
        case 'Left': // Older browsers
          event.preventDefault();
          onPrev();
          break;

        case 'ArrowRight':
        case 'Right': // Older browsers
          event.preventDefault();
          onNext();
          break;

        case ' ': // Space
        case 'Spacebar': // Older browsers
          event.preventDefault();
          toggleAutoplay();
          break;

        case 'Home':
          event.preventDefault();
          // Можно добавить переход к первому слайду если нужно
          break;

        case 'End':
          event.preventDefault();
          // Можно добавить переход к последнему слайду если нужно
          break;

        default:
          // Игнорируем другие клавиши
          break;
      }
    },
    [onPrev, onNext, toggleAutoplay],
  );

  return handleKeyDown;
};
