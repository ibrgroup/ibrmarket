'use client';

import { cn } from '@/shared/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { SORT_OPTIONS } from '../model/constants';
import type { FilterState } from '../model/types';

interface SortSelectProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  triggerClassName?: string;
}

export function SortSelect({ filters, onFiltersChange, triggerClassName }: SortSelectProps) {
  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [
      FilterState['sortBy'],
      FilterState['sortOrder'],
    ];
    onFiltersChange({ ...filters, sortBy, sortOrder });
  };

  const currentValue = `${filters.sortBy}-${filters.sortOrder}`;

  return (
    <Select value={currentValue} onValueChange={handleSortChange}>
      <SelectTrigger
        className={cn(
          'bg-background w-full min-w-0 sm:w-[180px] sm:min-w-[180px] sm:bg-muted/60 sm:shadow-none',
          triggerClassName,
        )}
      >
        <SelectValue placeholder="Сортировка" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <div key={option.value}>
            <SelectItem value={`${option.value}-asc`}>{option.label} ↑</SelectItem>
            <SelectItem value={`${option.value}-desc`}>{option.label} ↓</SelectItem>
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}
