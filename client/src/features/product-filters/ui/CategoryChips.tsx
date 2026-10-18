'use client';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { ChevronDown } from 'lucide-react';
import { getRootCategoryFilters } from '../lib/category-filter-tree';
import type { CategoryFilter, FilterState } from '../model/types';

interface CategoryChipsProps {
  /** Дерево категорий (корень → дети) */
  categoryTree: CategoryFilter[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  maxVisible?: number;
  /** Одна строка с горизонтальным скроллом (десктоп-панель) */
  nowrap?: boolean;
  className?: string;
}

/**
 * Горизонтальные чипсы корневых категорий.
 * «Ещё» — только остальные корневые (без дерева): вложенность смотрят в «Каталог».
 */
export function CategoryChips({
  categoryTree,
  filters,
  onFiltersChange,
  maxVisible = 5,
  nowrap = false,
  className,
}: CategoryChipsProps) {
  const rootCategories = getRootCategoryFilters(categoryTree);

  const visibleCategories = (() => {
    const withCount = rootCategories
      .filter((cat) => (cat.count ?? 0) > 0)
      .sort((a, b) => (b.count || 0) - (a.count || 0));
    if (withCount.length > 0) {
      return withCount.slice(0, maxVisible);
    }
    return [...rootCategories]
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
      .slice(0, maxVisible);
  })();

  const visibleIds = new Set(visibleCategories.map((c) => c.value));
  const overflowCategories = rootCategories
    .filter((c) => !visibleIds.has(c.value))
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
  const showMoreDropdown = overflowCategories.length > 0;

  const toggleCategory = (categoryValue: string) => {
    const newCategories = filters.categories.includes(categoryValue)
      ? filters.categories.filter((c) => c !== categoryValue)
      : [...filters.categories, categoryValue];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  return (
    <div className={cn('flex items-center gap-2', nowrap ? 'flex-nowrap' : 'flex-wrap', className)}>
      {visibleCategories.map((category) => {
        const isActive = filters.categories.includes(category.value);
        const showCount = typeof category.count === 'number' && category.count > 0;
        return (
          <Button
            key={category.value}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleCategory(category.value)}
            className="h-8 shrink-0 rounded-full px-3"
          >
            {category.label}
            {showCount ? (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs tabular-nums">
                {category.count}
              </Badge>
            ) : null}
          </Button>
        );
      })}

      {showMoreDropdown ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0 rounded-full bg-muted/60 px-3"
            >
              Ещё
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-2">
            <ScrollArea className="max-h-[min(50vh,320px)]">
              <div className="flex flex-col gap-1 pr-2">
                {overflowCategories.map((category) => {
                  const isActive = filters.categories.includes(category.value);
                  const showCount = typeof category.count === 'number' && category.count > 0;
                  return (
                    <Button
                      key={category.value}
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => toggleCategory(category.value)}
                      className="h-9 w-full justify-between rounded-lg px-3 font-normal"
                    >
                      <span className="truncate text-left">{category.label}</span>
                      {showCount ? (
                        <Badge
                          variant={isActive ? 'secondary' : 'outline'}
                          className="ml-2 h-5 shrink-0 px-1.5 text-xs tabular-nums"
                        >
                          {category.count}
                        </Badge>
                      ) : null}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
