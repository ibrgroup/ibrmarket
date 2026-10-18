'use client';

import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { ChevronDown, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { RATING_OPTIONS } from '../model/constants';
import type { FilterState } from '../model/types';

interface RatingDropdownProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

/**
 * Dropdown для фильтрации по рейтингу
 */
export function RatingDropdown({ filters, onFiltersChange }: RatingDropdownProps) {
  const isActive = filters.rating > 0;
  const selectedOption = RATING_OPTIONS.find(opt => opt.value === filters.rating);

  const handleRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      rating: filters.rating === rating ? 0 : rating,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 shadow-none border-none bg-gray-100">
          <Star className="mr-1 h-3 w-3" />
          {selectedOption?.label || 'Рейтинг'}
          <ChevronDown className="ml-1 h-3 w-3" />
          {isActive && (
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              1
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {RATING_OPTIONS.map(option => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleRatingChange(option.value)}
            className="cursor-pointer"
          >
            <div className="flex w-full items-center justify-between">
              <span>{option.label}</span>
              {filters.rating === option.value && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  ✓
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
