'use client';

import { Button } from '@/shared/ui/button';

export function CatalogErrorPanel({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm text-muted-foreground">
        {message ?? 'Не удалось загрузить категории. Проверьте соединение и попробуйте снова.'}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}

export function CatalogEmptyPanel() {
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
      Категории пока не настроены.
    </div>
  );
}

export function DesktopCatalogSkeleton({ fourColumns = false }: { fourColumns?: boolean }) {
  const cols = fourColumns ? 4 : 3;
  return (
    <div
      className={
        fourColumns
          ? 'grid h-full min-h-0 w-full grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border/70'
          : 'grid h-full min-h-0 w-full grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3 lg:divide-x lg:divide-border/70'
      }
      aria-hidden
    >
      {Array.from({ length: cols }, (_, col) => (
        <div key={col} className="flex flex-col border-b border-border/70 lg:border-b-0">
          <div className="shrink-0 border-b border-border/70 px-4 py-3">
            <div className="bg-muted h-3 w-20 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-4 w-36 animate-pulse rounded" />
          </div>
          <div className="space-y-0 p-2">
            {Array.from({ length: col === 0 ? 8 : 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                {col === 0 ? (
                  <div className="bg-muted size-6 shrink-0 animate-pulse rounded-md" />
                ) : null}
                <div className="bg-muted h-4 flex-1 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MobileCatalogSkeleton() {
  return (
    <div className="space-y-2.5 px-3 py-3" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border/50 bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="bg-muted size-10 shrink-0 animate-pulse rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="bg-muted h-4 max-w-[220px] animate-pulse rounded" />
              <div className="bg-muted h-3 max-w-[120px] animate-pulse rounded" />
            </div>
            <div className="bg-muted size-10 shrink-0 animate-pulse rounded-full" />
          </div>
          <div className="mt-3 border-t border-border/40 pt-3">
            <div className="bg-muted mx-auto h-3 w-48 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
