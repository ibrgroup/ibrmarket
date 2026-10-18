import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';

/** Плейсхолдер под единый layout ProductCard (квадратное фото, блок текста, кнопка). */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl bg-card dark:border-border/50',
        className,
      )}
    >
      <div className="relative w-full shrink-0 bg-card">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
          <Skeleton className="absolute inset-0 h-full w-full rounded-2xl bg-muted/70" />
        </div>
        <Skeleton className="absolute top-2 right-3 z-10 h-8 w-8 rounded-full border border-border/30 bg-background/90 dark:bg-background/80" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 pt-1">
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-4 w-14 rounded-md opacity-60" />
          </div>
          <div className="min-h-[2.5rem] space-y-2">
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-4/5 rounded-md" />
          </div>
          <div className="flex min-h-[1.25rem] items-center gap-2">
            <Skeleton className="h-3 w-12 rounded-md opacity-70" />
            <Skeleton className="h-3 max-w-[100px] flex-1 rounded-md opacity-50" />
          </div>
        </div>
        <div className="mt-auto w-full pt-2">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
