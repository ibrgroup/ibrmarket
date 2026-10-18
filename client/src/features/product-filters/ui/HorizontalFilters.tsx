'use client';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Filter } from 'lucide-react';
import { useState } from 'react';
import { useActiveFiltersCount } from '../lib';
import type { BrandFilter, CategoryFilter, FilterState } from '../model/types';
import { BrandDropdown } from './BrandDropdown';
import { CategoryChips } from './CategoryChips';
import { MobileFilterModal } from './MobileFilterModal';
import { PriceDropdown } from './PriceDropdown';
import { RatingDropdown } from './RatingDropdown';
import { SortSelect } from './SortSelect';
import { ViewToggle } from './ViewToggle';

interface HorizontalFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categoryTree: CategoryFilter[];
  brands: BrandFilter[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  productsCount?: number;
}

/**
 * Мобильные: кнопка «Фильтры» + сортировка + вид.
 * Десктоп: панель с чипами (скролл), строка с выпадашками и сортировкой; «Все фильтры» открывает sheet справа.
 */
export function HorizontalFilters({
  filters,
  onFiltersChange,
  categoryTree,
  brands,
  viewMode,
  onViewModeChange,
  productsCount,
}: HorizontalFiltersProps) {
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const activeFiltersCount = useActiveFiltersCount(filters);

  const handleSortChange = (newFilters: FilterState) => {
    onFiltersChange(newFilters);
  };

  return (
    <>
      {/* Мобильная панель */}
      <div className="flex flex-col gap-2 lg:hidden">
        <div className="flex items-stretch gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setMobileModalOpen(true)}
            className="h-11 shrink-0 gap-2 rounded-xl bg-card px-4"
          >
            <Filter className="size-4" />
            <span className="font-medium">Фильтры</span>
            {activeFiltersCount > 0 ? (
              <Badge
                variant="default"
                className="ml-0.5 min-w-6 justify-center px-1.5 text-xs font-bold tabular-nums"
              >
                {activeFiltersCount}
              </Badge>
            ) : null}
          </Button>
          <div className="min-w-0 flex-1">
            <SortSelect
              filters={filters}
              onFiltersChange={handleSortChange}
              triggerClassName="h-11 w-full rounded-xl"
            />
          </div>
          <ViewToggle
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            className="shrink-0 hidden md:block"
          />
        </div>
      </div>

      {/* Десктоп */}
      <div className="hidden flex-col gap-4 rounded-2xl bg-card px-4 py-4 lg:flex">
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setMobileModalOpen(true)}
            className="h-10 shrink-0 gap-2 rounded-xl px-4 shadow-none"
          >
            <Filter className="h-4 w-4" />
            Все фильтры
            {activeFiltersCount > 0 ? (
              <Badge variant="secondary" className="ml-0.5 tabular-nums">
                {activeFiltersCount}
              </Badge>
            ) : null}
          </Button>

          <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <CategoryChips
              categoryTree={categoryTree}
              filters={filters}
              onFiltersChange={onFiltersChange}
              maxVisible={8}
              nowrap
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <BrandDropdown brands={brands} filters={filters} onFiltersChange={onFiltersChange} />
            <PriceDropdown filters={filters} onFiltersChange={onFiltersChange} />
            <RatingDropdown filters={filters} onFiltersChange={onFiltersChange} />
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <SortSelect
              filters={filters}
              onFiltersChange={handleSortChange}
              triggerClassName="h-10 min-w-[200px] rounded-xl"
            />
            <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          </div>
        </div>
      </div>

      <MobileFilterModal
        open={mobileModalOpen}
        onOpenChange={setMobileModalOpen}
        filters={filters}
        onFiltersChange={onFiltersChange}
        categoryTree={categoryTree}
        brands={brands}
        productsCount={productsCount}
      />
    </>
  );
}
