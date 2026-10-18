'use client';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Checkbox } from '@/shared/ui/checkbox';
import type { CategoryFilter } from '../model/types';

export interface CategoryFilterTreeProps {
  categories: CategoryFilter[];
  selected: string[];
  onToggle: (categoryValue: string) => void;
  embedded?: boolean;
  level?: number;
}

/**
 * Иерархический список категорий с отступами по уровню вложенности.
 */
export function CategoryFilterTree({
  categories,
  selected,
  onToggle,
  embedded = false,
  level = 0,
}: CategoryFilterTreeProps) {
  const rowClass = embedded
    ? 'flex min-h-[44px] items-center gap-3 rounded-xl px-0 py-0.5 active:bg-muted/50'
    : 'flex items-center space-x-2';

  const labelClass = embedded
    ? 'flex-1 cursor-pointer text-base leading-snug font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
    : 'flex-1 cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70';

  return (
    <ul
      className={cn(level === 0 ? 'space-y-0.5' : 'mt-0.5 space-y-0.5 border-l border-border/60')}
    >
      {categories.map((category) => {
        const isChecked = selected.includes(category.value);
        const hasChildren = Boolean(category.children?.length);
        const paddingLeft = level > 0 ? Math.min(level * 14, 42) : 0;

        return (
          <li key={`${level}-${category.value}`}>
            <div className={rowClass} style={paddingLeft > 0 ? { paddingLeft } : undefined}>
              <Checkbox
                id={`category-tree-${level}-${category.value}`}
                checked={isChecked}
                onCheckedChange={() => onToggle(category.value)}
                className={embedded ? 'size-5' : undefined}
              />
              <label htmlFor={`category-tree-${level}-${category.value}`} className={labelClass}>
                {category.label}
              </label>
              {typeof category.count === 'number' && category.count > 0 ? (
                <Badge
                  variant="outline"
                  className="text-muted-foreground shrink-0 text-xs tabular-nums"
                >
                  {category.count}
                </Badge>
              ) : null}
            </div>
            {hasChildren ? (
              <CategoryFilterTree
                categories={category.children!}
                selected={selected}
                onToggle={onToggle}
                embedded={embedded}
                level={level + 1}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
