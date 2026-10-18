'use client';

import { cn } from '@/shared/lib/utils';
import { A11y, FreeMode, Keyboard, Mousewheel } from 'swiper/modules';
import { Swiper } from 'swiper/react';

type HorizontalFreeSwipeProps = {
  className?: string;
  /** Отступ между слайдами (px), по умолчанию 8 */
  spaceBetween?: number;
  children: React.ReactNode;
};

/**
 * Горизонтальная лента: перетаскивание мышью/тача, инерция, колёсико по оси (трекпад).
 */
export function HorizontalFreeSwipe({
  className,
  spaceBetween = 8,
  children,
}: HorizontalFreeSwipeProps) {
  return (
    <Swiper
      modules={[A11y, FreeMode, Keyboard, Mousewheel]}
      slidesPerView="auto"
      spaceBetween={spaceBetween}
      grabCursor
      freeMode={{ enabled: true, momentum: true, momentumBounce: false }}
      keyboard={{ enabled: true, onlyInViewport: true }}
      mousewheel={{ forceToAxis: true, sensitivity: 1 }}
      watchOverflow
      resistanceRatio={0.65}
      threshold={6}
      a11y={{ enabled: true }}
      touchStartPreventDefault
      touchMoveStopPropagation
      preventInteractionOnTransition
      className={cn('min-w-0 w-full !overflow-hidden select-none', className)}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </Swiper>
  );
}
