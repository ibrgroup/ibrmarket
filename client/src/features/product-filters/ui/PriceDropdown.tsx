'use client';

import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { Slider } from '@/shared/ui/slider';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { PRICE_RANGE } from '../model/constants';
import { isPriceRangeActive } from '../lib/utils';
import type { FilterState } from '../model/types';

interface PriceDropdownProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

/**
 * Dropdown для фильтрации по цене
 */
export function PriceDropdown({ filters, onFiltersChange }: PriceDropdownProps) {
  const isActive = isPriceRangeActive(filters.priceRange);

  const handlePriceChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: [value[0], value[1]] as [number, number],
    });
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(Number(e.target.value), filters.priceRange[1]));
    onFiltersChange({
      ...filters,
      priceRange: [value, filters.priceRange[1]],
    });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(
      filters.priceRange[0],
      Math.min(Number(e.target.value), PRICE_RANGE.max),
    );
    onFiltersChange({
      ...filters,
      priceRange: [filters.priceRange[0], value],
    });
  };

  const getPriceLabel = () => {
    if (!isActive) return 'Цена, ₽';
    return `${filters.priceRange[0].toLocaleString()} - ${filters.priceRange[1].toLocaleString()} ₽`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 bg-gray-100 shadow-none border-none">
          {getPriceLabel()}
          <ChevronDown className="ml-1 h-3 w-3" />
          {isActive && (
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              1
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-4">
        <div className="space-y-4 cursor-pointer">
          <div className="space-y-2">
            <Slider
              value={filters.priceRange}
              onValueChange={handlePriceChange}
              max={PRICE_RANGE.max}
              min={PRICE_RANGE.min}
              step={PRICE_RANGE.step}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price-min" className="text-xs">
                От
              </Label>
              <Input
                id="price-min"
                type="number"
                value={filters.priceRange[0]}
                onChange={handleMinChange}
                min={0}
                max={filters.priceRange[1]}
                className="h-8"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price-max" className="text-xs">
                До
              </Label>
              <Input
                id="price-max"
                type="number"
                value={filters.priceRange[1]}
                onChange={handleMaxChange}
                min={filters.priceRange[0]}
                max={PRICE_RANGE.max}
                className="h-8"
              />
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
