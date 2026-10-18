'use client';

import type { AdminCategoryRow } from '@/shared/api/services/admin-category-service';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

type Props = {
  categories: AdminCategoryRow[];
  value: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
  className?: string;
};

function buildCategoryLabel(
  category: AdminCategoryRow,
  catLookup: Map<string, AdminCategoryRow>,
): string {
  const parent = category.parentId ? catLookup.get(String(category.parentId)) : undefined;
  return parent ? `${parent.name} › ${category.name}` : category.name;
}

export function AdminCategoryCombobox({ categories, value, onChange, disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  const catLookup = useMemo(() => new Map(categories.map((c) => [c._id, c])), [categories]);

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [categories],
  );

  const selectedLabel = value
    ? buildCategoryLabel(catLookup.get(value) ?? { _id: value, name: '—' }, catLookup)
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between bg-gray-100 font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{selectedLabel ?? 'Выберите категорию'}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[80] w-[min(100vw-2rem,22rem)] p-0" align="start">
        <Command shouldFilter>
          <CommandInput placeholder="Поиск категории…" />
          <CommandList className="max-h-72">
            <CommandEmpty>Категории не найдены</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__ не выбрана"
                onSelect={() => {
                  onChange('');
                  setOpen(false);
                }}
              >
                <Check className={cn('mr-2 size-4', !value ? 'opacity-100' : 'opacity-0')} />— не
                выбрана —
              </CommandItem>
              {sorted.map((c) => {
                const label = buildCategoryLabel(c, catLookup);
                return (
                  <CommandItem
                    key={c._id}
                    value={`${label} ${c.name} ${c._id}`}
                    onSelect={() => {
                      onChange(c._id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn('mr-2 size-4', value === c._id ? 'opacity-100' : 'opacity-0')}
                    />
                    <span className="truncate">{label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
