'use client';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { ChevronDown } from 'lucide-react';
import type { BrandFilter, FilterState } from '../model/types';

interface BrandDropdownProps {
  brands: BrandFilter[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

/**
 * Dropdown для выбора брендов с мультивыбором
 */
export function BrandDropdown({ brands, filters, onFiltersChange }: BrandDropdownProps) {
  const activeBrandsCount = filters.brands.length;

  const toggleBrand = (brandValue: string) => {
    const newBrands = filters.brands.includes(brandValue)
      ? filters.brands.filter((b) => b !== brandValue)
      : [...filters.brands, brandValue];
    onFiltersChange({ ...filters, brands: newBrands });
  };

  const getSelectedBrandsLabel = () => {
    if (activeBrandsCount === 0) return 'Бренды';
    if (activeBrandsCount === 1) {
      const brand = brands.find((b) => b.value === filters.brands[0]);
      return brand?.label || 'Бренды';
    }
    return `Бренды (${activeBrandsCount})`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-none shadow-none bg-gray-100">
          {getSelectedBrandsLabel()}
          <ChevronDown className="ml-1 h-3 w-3" />
          {activeBrandsCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {activeBrandsCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-1 p-1">
            {brands.map((brand) => {
              const isChecked = filters.brands.includes(brand.value);
              return (
                <div
                  key={brand.value}
                  className="cursor-pointer hover:bg-accent flex items-center space-x-2 rounded-sm px-2 py-1.5"
                >
                  <Checkbox
                    className="cursor-pointer"
                    id={`brand-${brand.value}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleBrand(brand.value)}
                  />
                  <label
                    htmlFor={`brand-${brand.value}`}
                    className="flex flex-1 cursor-pointer items-center justify-between text-sm"
                  >
                    <span>{brand.label}</span>
                    {typeof brand.count === 'number' && brand.count > 0 ? (
                      <Badge variant="outline" className="ml-2 text-xs tabular-nums">
                        {brand.count}
                      </Badge>
                    ) : null}
                  </label>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
