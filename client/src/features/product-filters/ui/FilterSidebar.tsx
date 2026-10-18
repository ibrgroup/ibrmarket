'use client';

import { cn } from '@/shared/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Slider } from '@/shared/ui/slider';
import { Filter, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useActiveFiltersCount } from '../lib';
import {
  DEFAULT_FILTER_STATE,
  PRICE_RANGE,
  RATING_OPTIONS,
  STOCK_OPTIONS,
} from '../model/constants';
import type { BrandFilter, CategoryFilter, FilterState } from '../model/types';
import { CategoryFilterTree } from './CategoryFilterTree';

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: CategoryFilter[];
  brands: BrandFilter[];
  className?: string;
  /** Drawer / полноэкранные фильтры: без карточки, секции по умолчанию свёрнуты */
  embedded?: boolean;
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  categories,
  brands,
  className,
  embedded = false,
}: FilterSidebarProps) {
  /** В drawer (embedded) и в боковой колонке по умолчанию все секции свёрнуты — как на маркетплейсах */
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => ({
    categories: false,
    brands: false,
    price: false,
    rating: false,
    stock: false,
  }));

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'categories' | 'brands', value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const resetFilters = () => {
    onFiltersChange(DEFAULT_FILTER_STATE);
  };

  const activeFiltersCount = useActiveFiltersCount(filters);

  const triggerClass = embedded
    ? 'px-0 py-4 text-base font-semibold hover:no-underline [&[data-state=open]>svg]:text-primary'
    : 'focus:ring-ring rounded-md py-3 text-sm font-medium hover:no-underline focus:ring-2 focus:ring-offset-2 focus:outline-none data-[state=closed]:pb-3 data-[state=open]:pb-3';

  const rowClass = embedded
    ? 'flex min-h-[48px] items-center gap-3 rounded-xl px-0 py-0.5 active:bg-muted/50'
    : 'flex items-center space-x-2';

  const labelClass = embedded
    ? 'flex-1 cursor-pointer text-base leading-snug font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
    : 'flex-1 cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70';

  const contentPb = embedded ? 'pb-4' : 'pb-3';

  const accordion = (
    <Accordion
      type="multiple"
      value={Object.entries(expandedSections)
        .filter(([, v]) => v)
        .map(([key]) => key)}
      onValueChange={(value) =>
        setExpandedSections({
          categories: value.includes('categories'),
          brands: value.includes('brands'),
          price: value.includes('price'),
          rating: value.includes('rating'),
          stock: value.includes('stock'),
        })
      }
    >
      <AccordionItem value="categories" className="border-border/80 border-b py-0 first:pt-0">
        <AccordionTrigger className={triggerClass}>
          <span className="flex items-center gap-2">
            Категории
          </span>
        </AccordionTrigger>
        <AccordionContent
          className={cn(
            'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden pt-0 transition-all duration-200 ease-in-out',
            contentPb,
          )}
        >
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">Категории не найдены</p>
          ) : (
            <CategoryFilterTree
              categories={categories}
              selected={filters.categories}
              onToggle={(value) => toggleArrayFilter('categories', value)}
              embedded={embedded}
            />
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="brands" className="border-border/80 border-b py-0">
        <AccordionTrigger className={triggerClass}>
          <span className="flex items-center gap-2">
            Бренды
          </span>
        </AccordionTrigger>
        <AccordionContent
          className={cn(
            'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down space-y-1 overflow-hidden pt-0 transition-all duration-200 ease-in-out',
            contentPb,
          )}
        >
          {brands.map((brand, index) => (
            <div key={`${brand.value}-${index}`} className={rowClass}>
              <Checkbox
                id={`brand-${brand.value}`}
                checked={filters.brands.includes(brand.value)}
                onCheckedChange={() => toggleArrayFilter('brands', brand.value)}
                className={embedded ? 'size-5' : undefined}
              />
              <label htmlFor={`brand-${brand.value}`} className={labelClass}>
                {brand.label}
              </label>
              {typeof brand.count === 'number' && brand.count > 0 ? (
                <Badge
                  variant="outline"
                  className="text-muted-foreground shrink-0 text-xs tabular-nums"
                >
                  {brand.count}
                </Badge>
              ) : null}
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="price" className="border-border/80 border-b py-0">
        <AccordionTrigger className={triggerClass}>
          <span>Цена</span>
        </AccordionTrigger>
        <AccordionContent
          className={cn(
            'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down space-y-4 overflow-hidden pt-0 transition-all duration-200 ease-in-out',
            contentPb,
          )}
        >
          {/*
            Горизонтальный отступ обязателен: ручки слайдера (thumb) вылезают за track,
            иначе overflow-hidden у аккордеона их обрезает.
          */}
          <div className={cn('space-y-3', embedded ? 'px-3 py-2 sm:px-4' : 'px-1 py-1 sm:px-2')}>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
              max={PRICE_RANGE.max}
              min={PRICE_RANGE.min}
              step={PRICE_RANGE.step}
              className="w-full py-2"
            />
            <div className="text-muted-foreground flex justify-between text-sm font-medium tabular-nums">
              <span>
                {filters.priceRange[0].toLocaleString('ru-RU')} {'\u00A0'}
                {'\u20BD'}
              </span>
              <span>
                {filters.priceRange[1].toLocaleString('ru-RU')} {'\u00A0'}
                {'\u20BD'}
              </span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="rating" className="border-border/80 border-b py-0">
        <AccordionTrigger className={triggerClass}>
          <span className="flex items-center gap-2">
            Рейтинг
          </span>
        </AccordionTrigger>
        <AccordionContent
          className={cn(
            'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down space-y-1 overflow-hidden pt-0 transition-all duration-200 ease-in-out',
            contentPb,
          )}
        >
          {RATING_OPTIONS.map((option, index) => (
            <div key={`${option.value}-${index}`} className={rowClass}>
              <Checkbox
                id={`rating-${option.value}`}
                checked={filters.rating === option.value}
                onCheckedChange={() => updateFilter('rating', option.value)}
                className={embedded ? 'size-5' : undefined}
              />
              <label htmlFor={`rating-${option.value}`} className={labelClass}>
                {option.label}
              </label>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="stock" className="border-border/80 last:border-b-0">
        <AccordionTrigger className={triggerClass}>
          <span>Наличие</span>
        </AccordionTrigger>
        <AccordionContent
          className={cn(
            'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down space-y-1 overflow-hidden pt-0 transition-all duration-200 ease-in-out',
            contentPb,
          )}
        >
          {STOCK_OPTIONS.map((option, index) => (
            <div key={`${option.value}-${index}`} className={rowClass}>
              <Checkbox
                id={`stock-${String(option.value)}-${index}`}
                checked={filters.inStock === option.value}
                onCheckedChange={() => updateFilter('inStock', option.value)}
                className={embedded ? 'size-5' : undefined}
              />
              <label htmlFor={`stock-${String(option.value)}-${index}`} className={labelClass}>
                {option.label}
              </label>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  if (embedded) {
    return (
      <div className={cn('flex min-h-0 w-full flex-1 flex-col bg-transparent', className)}>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-4 pt-1 sm:px-5">
          {accordion}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('w-80 shrink-0', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 w-8 p-0"
              aria-label="Сбросить фильтры"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-0">
        <ScrollArea className="h-[calc(100vh-200px)] pr-4">{accordion}</ScrollArea>
      </CardContent>
    </Card>
  );
}
