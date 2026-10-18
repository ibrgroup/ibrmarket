'use client';

import { cn } from '@/shared/lib/utils';
import { HorizontalFreeSwipe } from '@/shared/ui/horizontal-free-swipe';
import { Fragment } from 'react';
import { SwiperSlide } from 'swiper/react';
import { getProductColorVisual } from '../lib/product-color-options';

type ProductColorPickerProps = {
  colors: string[];
  selected: string;
  onSelect: (value: string) => void;
  /** Узкие кнопки и семплы — для модалки быстрого просмотра и плотных макетов */
  compact?: boolean;
  /** Одна строка с перетаскиванием (Swiper FreeMode) вместо overflow-x */
  swipeableRow?: boolean;
};

export function ProductColorPicker({
  colors,
  selected,
  onSelect,
  compact = false,
  swipeableRow = false,
}: ProductColorPickerProps) {
  if (colors.length === 0) return null;

  const gapPx = compact ? 6 : 8;

  const renderColorButton = (c: string) => {
    const v = getProductColorVisual(c);
    const isSel = selected === c;
    return (
      <button
        type="button"
        onClick={() => onSelect(c)}
        className={cn(
          'inline-flex cursor-pointer m-1 items-center transition-colors',
          compact
            ? 'min-h-0 gap-1.5 rounded-md px-2 py-1 text-xs leading-tight'
            : 'min-h-11 gap-2 rounded-xl px-2.5 py-1.5 text-sm',
          isSel
            ? compact
              ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40'
              : 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/35'
            : 'border-border bg-background text-foreground hover:bg-muted/70',
        )}
      >
        <span
          className={cn(
            'shrink-0 rounded-full dark:border-white/20',
            compact ? 'h-4 w-4' : 'h-7 w-7',
            v.ring &&
              (compact
                ? 'ring-1 ring-border ring-offset-1 ring-offset-background'
                : 'ring-2 ring-border ring-offset-1 ring-offset-background'),
          )}
          style={v.style}
          aria-hidden
        />
        <span className="">{v.label}</span>
      </button>
    );
  };

  const row = swipeableRow ? (
    <HorizontalFreeSwipe spaceBetween={gapPx}>
      {colors.map((c) => (
        <SwiperSlide key={c} className="!w-auto">
          {renderColorButton(c)}
        </SwiperSlide>
      ))}
    </HorizontalFreeSwipe>
  ) : (
    <div className={cn('flex flex-wrap', compact ? 'gap-1.5' : 'gap-2')}>
      {colors.map((c) => (
        <Fragment key={c}>{renderColorButton(c)}</Fragment>
      ))}
    </div>
  );

  return (
    <div className="flex justify-between items-center gap-3">
      <div>{row}</div>
    </div>
  );
}
