'use client';

import type { AdminSortOption } from '@/shared/lib/admin-sort';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

type Props = {
  id?: string;
  label: string;
  value: string;
  options: AdminSortOption[];
  onValueChange: (value: string) => void;
  /** Ширина триггера */
  className?: string;
};

export function AdminSortSelect({
  id = 'admin-sort',
  label,
  value,
  options,
  onValueChange,
  className = 'w-full min-w-[200px] sm:w-[260px]',
}: Props) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs font-normal">
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className={`bg-gray-200 cursor-pointer ${className}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem className=' cursor-pointer' key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
