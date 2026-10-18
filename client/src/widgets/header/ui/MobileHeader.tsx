'use client';

import { ImageSearchButton, MobileSearchDialog } from '@/features/product-search';
import { cn } from '@/shared/lib/utils';
import type { HeaderMode } from '@/widgets/site-chrome/lib/chrome-config';
import { TopBarMobileStrip } from '@/widgets/top-bar/ui/TopBarMobileStrip';
import { useEffect, useRef, useState } from 'react';
import { IoSearch } from 'react-icons/io5';
import { SlArrowRight } from 'react-icons/sl';

type MobileHeaderProps = {
  mode?: HeaderMode;
  showTopBar?: boolean;
};

const MOBILE_SEARCH_DOCK_MIN_H = 'min-h-[calc(3.35rem+max(0.5rem,env(safe-area-inset-top,0px)))]';

const GRADIENT = 'bg-gradient-to-r from-indigo-700 to-blue-500 ';
const SAFE_TOP = 'pt-[max(0.5rem,env(safe-area-inset-top,0px))]';

function MobileSearchRow({
  onOpen,
  compact = false,
  searchLabel = 'Искать на ibrmarket',
  iconSize = 22,
  labelClassName,
}: {
  onOpen: () => void;
  compact?: boolean;
  searchLabel?: string;
  iconSize?: number;
  labelClassName?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-1 rounded-[1.2rem] border bg-background px-2 py-1.5',
        'transition-[border-color,box-shadow] duration-300 ease-out',
        compact ? 'border-border/80 bg-indigo-100' : 'border-border/70',
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-1 py-1.5 text-left text-sm text-muted-foreground"
        onClick={onOpen}
        aria-label="Открыть поиск"
      >
        <IoSearch size={iconSize} className="shrink-0 text-primary/70" />
        <span
          className={cn(
            'truncate font-roboto font-bold text-primary/70',
            labelClassName ?? 'text-base',
          )}
        >
          {searchLabel}
        </span>
      </button>
      <ImageSearchButton className="p-1.5" size={iconSize} />
    </div>
  );
}

function MobilePromoBanner() {
  return (
    <div className="relative flex items-center justify-between overflow-hidden px-4 pb-4 pt-1">
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMinYMin slice">
          <defs>
            <pattern id="mobile-header-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#mobile-header-grid)" />
        </svg>
      </div>
      <div className="relative">
        <p className="font-roboto text-md w-[180px] leading-4 font-bold text-white dark:text-[#f2f2f2]">
          СКИДКИ ДО 60% НА ПОКУПКИ ТОВАРОВ
        </p>
        <button
          type="button"
          className="relative m-0 mt-2 flex w-40 items-center justify-center rounded-full bg-gray-900 p-0.5 font-roboto text-[14px] font-bold text-white dark:bg-[#1D2025] dark:text-[#f2f2f2]"
        >
          Скидки до 60%
          <SlArrowRight className="absolute right-2" size={13} />
        </button>
      </div>
      <img className="absolute top-2 right-2 w-20" src="/cros.png" alt="" />
    </div>
  );
}

function useMobileSearchPinned(sentinelRef: React.RefObject<HTMLDivElement | null>) {
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => setIsPinned(!entry.isIntersecting), {
      root: null,
      threshold: 0,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef]);

  return isPinned;
}

function MobileSearchDock({
  isPinned,
  withGradient,
  withSafeTop,
  children,
}: {
  isPinned: boolean;
  withGradient: boolean;
  withSafeTop: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'left-0 right-0 z-[55] w-full',
        'transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300 ease-out',
        isPinned
          ? 'fixed top-0 border-b rounded-b-3xl border-border/20 bg-background/97 shadow-[0_4px_24px_-10px_rgba(15,23,42,0.18)] backdrop-blur-lg'
          : cn('relative', withGradient && GRADIENT),
        isPinned && SAFE_TOP,
        !isPinned && withSafeTop && SAFE_TOP,
      )}
    >
      <div className={cn('px-3 pt-1', isPinned ? 'pb-2' : 'pb-0')}>{children}</div>
    </div>
  );
}

export function MobileHeader({ mode = 'full', showTopBar = false }: MobileHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isPinned = useMobileSearchPinned(sentinelRef);
  const isSearchOnly = mode === 'search-only';

  const searchRow = (
    <MobileSearchRow
      onOpen={() => setIsSearchOpen(true)}
      compact={isPinned || isSearchOnly}
      searchLabel={isSearchOnly ? 'Искать на ibrmarket' : 'Искать'}
      iconSize={isSearchOnly ? 22 : 25}
      labelClassName={isSearchOnly ? 'text-base' : 'text-xl'}
    />
  );

  if (isSearchOnly) {
    return (
      <>
        <div className={cn('md:hidden', GRADIENT, !isPinned && SAFE_TOP)}>
          <div ref={sentinelRef} className="pointer-events-none h-px w-full" aria-hidden />
          <div className={cn('relative w-full', isPinned && MOBILE_SEARCH_DOCK_MIN_H)}>
            <MobileSearchDock isPinned={isPinned} withGradient={!isPinned} withSafeTop={false}>
              {searchRow}
            </MobileSearchDock>
          </div>
        </div>
        <MobileSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      </>
    );
  }

  return (
    <>
      {showTopBar ? (
        <div className={cn(GRADIENT, SAFE_TOP, 'md:hidden')}>
          <TopBarMobileStrip />
        </div>
      ) : null}

      <div
        className={cn(GRADIENT, 'overflow-hidden rounded-b-3xl md:hidden', !showTopBar && SAFE_TOP)}
      >
        <div ref={sentinelRef} className="pointer-events-none h-px w-full" aria-hidden />

        <div className={cn('relative w-full', isPinned && MOBILE_SEARCH_DOCK_MIN_H)}>
          <MobileSearchDock isPinned={isPinned} withGradient={false} withSafeTop={false}>
            {searchRow}
          </MobileSearchDock>
        </div>

        <MobilePromoBanner />
      </div>

      <MobileSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
