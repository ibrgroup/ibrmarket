'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Search, X } from 'lucide-react';
import Link from 'next/link';

function formatGoodsCount(n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return `${n.toLocaleString('ru-RU')} товаров`;
  if (last === 1) return `${n.toLocaleString('ru-RU')} товар`;
  if (last >= 2 && last <= 4) return `${n.toLocaleString('ru-RU')} товара`;
  return `${n.toLocaleString('ru-RU')} товаров`;
}

interface SearchResultsHeaderProps {
  query: string;
  totalProducts: number;
  isLoading: boolean;
  isVisualSearch?: boolean;
  onClear?: () => void;
  className?: string;
}

export function SearchResultsHeader({
  query,
  totalProducts,
  isLoading,
  isVisualSearch = false,
  onClear,
  className,
}: SearchResultsHeaderProps) {
  return (
    <div
      className={cn(
        'mt-3 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Search className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <h1 className="text-foreground font-roboto text-xl font-bold tracking-tight sm:text-2xl">
            {isVisualSearch ? 'Похожие по фото' : query ? 'Результаты поиска' : 'Поиск товаров'}
          </h1>
          {query && !isVisualSearch ? (
            <p className="text-muted-foreground text-sm">
              По запросу <span className="text-foreground font-medium">&laquo;{query}&raquo;</span>
              {!isLoading && totalProducts > 0 ? <> — {formatGoodsCount(totalProducts)}</> : null}
            </p>
          ) : !query && !isVisualSearch ? (
            <p className="text-muted-foreground text-sm">
              Введите название, бренд или категорию в строке поиска
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        {isLoading ? (
          <div className="bg-muted h-9 w-28 animate-pulse rounded-lg" aria-hidden />
        ) : query && !isVisualSearch ? (
          <p className="text-muted-foreground hidden text-sm tabular-nums sm:block">
            {formatGoodsCount(totalProducts)}
          </p>
        ) : null}
        {onClear && (query || isVisualSearch) ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={onClear}
          >
            <X className="mr-1.5 size-4" />
            {isVisualSearch ? 'Новый поиск' : 'Сбросить'}
          </Button>
        ) : null}
        <Button asChild variant="secondary" size="sm" className="rounded-xl">
          <Link href="/products">В каталог</Link>
        </Button>
      </div>
    </div>
  );
}
