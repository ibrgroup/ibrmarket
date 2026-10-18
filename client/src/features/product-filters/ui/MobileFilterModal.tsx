'use client';

import { useMediaQuery } from '@/shared/lib/hooks/use-media-query';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { Filter, RotateCcw, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useActiveFiltersCount } from '../lib';
import { DEFAULT_FILTER_STATE } from '../model/constants';
import type { BrandFilter, CategoryFilter, FilterState } from '../model/types';
import { FilterSidebar } from './FilterSidebar';

interface MobileFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categoryTree: CategoryFilter[];
  brands: BrandFilter[];
  productsCount?: number;
}

function FiltersPanelBody({
  tempFilters,
  setTempFilters,
  categoryTree,
  brands,
  productsCount,
  activeFiltersCount,
  onClose,
  onReset,
  onApply,
}: {
  tempFilters: FilterState;
  setTempFilters: (f: FilterState) => void;
  categoryTree: CategoryFilter[];
  brands: BrandFilter[];
  productsCount?: number;
  activeFiltersCount: number;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <>
      <header
        className={cn(
          'flex shrink-0 items-center gap-2 border-b border-border/80 bg-background px-4 py-3',
          'pt-[max(0.75rem,env(safe-area-inset-top))]',
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full"
          onClick={onClose}
          aria-label="Закрыть фильтры"
        >
          <X className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-left text-lg font-semibold">
            <Filter className="text-primary size-5 shrink-0" />
            <span className="truncate">Все фильтры</span>
            {activeFiltersCount > 0 ? (
              <Badge variant="secondary" className="shrink-0 font-semibold tabular-nums">
                {activeFiltersCount}
              </Badge>
            ) : null}
          </div>
          {typeof productsCount === 'number' ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              В каталоге: {productsCount.toLocaleString('ru-RU')} товаров
            </p>
          ) : null}
        </div>
        {activeFiltersCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground h-10 shrink-0 gap-1 px-2 text-xs font-medium"
            aria-label="Сбросить все фильтры"
          >
            <RotateCcw className="size-3.5" />
            Сбросить
          </Button>
        ) : (
          <div className="w-10 shrink-0" aria-hidden />
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/20">
        <FilterSidebar
          filters={tempFilters}
          onFiltersChange={setTempFilters}
          categories={categoryTree}
          brands={brands}
          embedded
          className="min-h-0 flex-1 border-0 bg-transparent shadow-none"
        />
      </div>

      <footer
        className={cn(
          'flex shrink-0 gap-3 border-t border-border/80 bg-background px-4 py-3',
          'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 flex-1 rounded-xl border-border/80"
          onClick={onClose}
        >
          Отмена
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-12 flex-1 rounded-xl font-semibold"
          onClick={onApply}
        >
          Показать
        </Button>
      </footer>
    </>
  );
}

/**
 * Мобильные: полноэкранный диалог. Десктоп (≥1024px): панель справа, как у маркетплейсов.
 */
export function MobileFilterModal({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  categoryTree,
  brands,
  productsCount,
}: MobileFilterModalProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  const activeFiltersCount = useActiveFiltersCount(tempFilters);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setTempFilters(filters);
      }
      onOpenChange(newOpen);
    },
    [filters, onOpenChange],
  );

  const handleReset = useCallback(() => {
    setTempFilters(DEFAULT_FILTER_STATE);
  }, []);

  const handleApply = useCallback(() => {
    onFiltersChange(tempFilters);
    onOpenChange(false);
  }, [tempFilters, onFiltersChange, onOpenChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const bodyProps = {
    tempFilters,
    setTempFilters,
    categoryTree,
    brands,
    productsCount,
    activeFiltersCount,
    onClose: handleCancel,
    onReset: handleReset,
    onApply: handleApply,
  };

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className={cn(
            'z-[100] border-l border-border/80 shadow-2xl',
            '[&>button]:hidden',
          )}
          aria-describedby={undefined}
        >
          <SheetTitle className="sr-only">Все фильтры каталога</SheetTitle>
          <div className="flex h-full min-h-0 flex-col">
            <FiltersPanelBody {...bodyProps} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[100] bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        className={cn(
          'fixed top-0 left-0 z-[100] flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 rounded-none border-0 p-0 shadow-none',
          'translate-x-0 translate-y-0',
          'duration-300 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4',
          'data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100',
        )}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Все фильтры каталога</DialogTitle>
        <FiltersPanelBody {...bodyProps} />
      </DialogContent>
    </Dialog>
  );
}
