'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Grid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  className?: string;
}

/**
 * Переключатель вида отображения (Grid/List)
 */
export function ViewToggle({ viewMode, onViewModeChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex h-11 items-center gap-0.5 rounded-xl bg-gray-100 p-1',
        className,
      )}
      role="group"
      aria-label="Вид каталога"
    >
      <Button
        type="button"
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className="h-9 w-9 rounded-lg p-0"
        aria-label="Плитка"
        aria-pressed={viewMode === 'grid'}
      >
        <Grid className="size-4" />
      </Button>
      <Button
        type="button"
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        className="h-9 w-9 rounded-lg p-0"
        aria-label="Список"
        aria-pressed={viewMode === 'list'}
      >
        <List className="size-4" />
      </Button>
    </div>
  );
}
