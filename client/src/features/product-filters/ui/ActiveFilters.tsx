'use client';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { X } from 'lucide-react';
import { isPriceRangeActive } from '../lib/utils';
import { RATING_OPTIONS } from '../model/constants';
import type { BrandFilter, CategoryFilter, FilterState } from '../model/types';

interface ActiveFiltersProps {
  filters: FilterState;
  onRemoveFilter: (type: keyof FilterState, value?: string | number) => void;
  onClearAll?: () => void;
  categories: CategoryFilter[];
  brands: BrandFilter[];
}

export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
  categories,
  brands,
}: ActiveFiltersProps) {
  const activeFilters: Array<{ type: keyof FilterState; label: string; value?: string | number }> =
    [];

  // Categories
  filters.categories.forEach((catValue) => {
    const category = categories.find((cat) => cat.value === catValue);
    if (category) {
      activeFilters.push({
        type: 'categories',
        label: category.label,
        value: catValue,
      });
    }
  });

  // Brands
  filters.brands.forEach((brandValue) => {
    const brand = brands.find((b) => b.value === brandValue);
    if (brand) {
      activeFilters.push({
        type: 'brands',
        label: brand.label,
        value: brandValue,
      });
    }
  });

  // Price range
  if (isPriceRangeActive(filters.priceRange)) {
    activeFilters.push({
      type: 'priceRange',
      label: `${filters.priceRange[0].toLocaleString()} - ${filters.priceRange[1].toLocaleString()} ₽`,
    });
  }

  // Rating
  if (filters.rating > 0) {
    const ratingOption = RATING_OPTIONS.find((opt) => opt.value === filters.rating);
    if (ratingOption) {
      activeFilters.push({
        type: 'rating',
        label: ratingOption.label,
        value: filters.rating,
      });
    }
  }

  // Stock
  if (filters.inStock !== null) {
    activeFilters.push({
      type: 'inStock',
      label: filters.inStock ? 'В наличии' : 'Нет в наличии',
      value: filters.inStock ? 1 : 0,
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
      {activeFilters.map((filter, index) => (
        <Badge
          key={`${filter.type}-${filter.value || index}`}
          variant="secondary"
          className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-sm"
        >
          <span>{filter.label}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemoveFilter(filter.type, filter.value)}
            aria-label={`Удалить фильтр ${filter.label}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {onClearAll ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-muted-foreground hover:text-foreground h-auto shrink-0 p-0 text-xs underline"
        >
          Очистить все
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Fallback: удаляем все фильтры по одному, если onClearAll не передан
            filters.categories.forEach((cat) => onRemoveFilter('categories', cat));
            filters.brands.forEach((brand) => onRemoveFilter('brands', brand));
            if (isPriceRangeActive(filters.priceRange)) {
              onRemoveFilter('priceRange');
            }
            if (filters.rating > 0) {
              onRemoveFilter('rating', filters.rating);
            }
            if (filters.inStock !== null) {
              onRemoveFilter('inStock', filters.inStock ? 1 : 0);
            }
          }}
          className="text-muted-foreground hover:text-foreground h-auto shrink-0 p-0 text-xs underline"
        >
          Очистить все
        </Button>
      )}
    </div>
  );
}
