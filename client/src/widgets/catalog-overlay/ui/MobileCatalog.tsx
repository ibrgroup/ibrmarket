'use client';

import { useCategories } from '@/entities/category';
import type { Category } from '@/entities/category/model/types';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ChevronLeft, ChevronRight, Package, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { findCategoryPathById, useCatalogState } from '../model/useCatalogState';
import { CatalogEmptyPanel, CatalogErrorPanel, MobileCatalogSkeleton } from './catalog-shared';
import { CategoryIcon } from './CategoryIcon';

type MobileCatalogProps = {
  initialCategory?: string;
  onClose: () => void;
};

function productCategoryHref(id: string) {
  return `/products?category=${encodeURIComponent(String(id))}`;
}

function BreadcrumbTrail({
  stack,
  onJump,
}: {
  stack: Category[];
  onJump: (depth: number) => void;
}) {
  return (
    <nav
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Путь по каталогу"
    >
      <button
        type="button"
        onClick={() => onJump(0)}
        className={cn(
          'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
          stack.length === 0
            ? 'bg-primary/15 text-primary'
            : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        Все категории
      </button>
      {stack.map((cat, idx) => {
        const depth = idx + 1;
        const isLast = depth === stack.length;
        return (
          <span key={`${cat._id}-${idx}`} className="flex shrink-0 items-center gap-1">
            <ChevronRight className="size-3 shrink-0 text-muted-foreground/70" aria-hidden />
            <button
              type="button"
              onClick={() => onJump(depth)}
              className={cn(
                'max-w-[140px] truncate rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                isLast
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {cat.name}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

export function MobileCatalog({ initialCategory, onClose }: MobileCatalogProps) {
  const { data: categories, isLoading, isError, error, refetch } = useCategories();
  const roots = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
  const { navigationStack, setNavigationStack } = useCatalogState(roots, initialCategory);

  useEffect(() => {
    if (!initialCategory || !roots.length) return;
    const path = findCategoryPathById(roots, initialCategory);
    if (path.length) setNavigationStack(path);
  }, [initialCategory, roots, setNavigationStack]);

  const currentLevel = navigationStack.length;
  const currentParent = currentLevel > 0 ? navigationStack[currentLevel - 1] : null;

  const currentCategories: Category[] = useMemo(() => {
    if (currentLevel === 0) return roots;
    const last = navigationStack[currentLevel - 1];
    return last?.children ?? [];
  }, [currentLevel, navigationStack, roots]);

  const goBack = useCallback(() => {
    setNavigationStack((prev) => prev.slice(0, -1));
  }, [setNavigationStack]);

  const jumpToDepth = useCallback(
    (depth: number) => {
      setNavigationStack((prev) => prev.slice(0, depth));
    },
    [setNavigationStack],
  );

  const headerTitle = currentLevel === 0 ? 'Каталог' : (currentParent?.name ?? 'Каталог');
  const subtitle =
    currentLevel === 0
      ? roots.length > 0
        ? `${roots.length} ${pluralRu(roots.length, 'раздел', 'раздела', 'разделов')}`
        : null
      : currentCategories.length > 0
        ? `${currentCategories.length} ${pluralRu(currentCategories.length, 'подраздел', 'подраздела', 'подразделов')}`
        : 'Нет вложенных разделов';

  let body: ReactNode;
  if (isLoading) {
    body = <MobileCatalogSkeleton />;
  } else if (isError) {
    body = (
      <div className="flex min-h-[50vh] flex-col justify-center px-4 py-6">
        <CatalogErrorPanel
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      </div>
    );
  } else if (roots.length === 0) {
    body = (
      <div className="flex min-h-[50vh] flex-col justify-center px-4 py-6">
        <CatalogEmptyPanel />
      </div>
    );
  } else if (currentCategories.length === 0 && currentLevel > 0 && currentParent) {
    body = (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
          <Package className="size-8 stroke-[1.25]" aria-hidden />
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold text-foreground">Подкатегорий нет</p>
          <p className="text-sm text-muted-foreground">
            В «{currentParent.name}» можно сразу открыть список товаров.
          </p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-2">
          <Button asChild className="w-full rounded-xl" size="lg">
            <Link href={productCategoryHref(currentParent._id)} onClick={onClose}>
              Смотреть товары
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            size="lg"
            onClick={goBack}
          >
            Назад к разделам
          </Button>
        </div>
      </div>
    );
  } else {
    body = (
      <ul
        key={currentLevel}
        className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-200 space-y-2.5 px-3 pb-6 pt-2"
        role="list"
        aria-label={currentLevel === 0 ? 'Корневые категории' : 'Подкатегории'}
      >
        {currentCategories.map((cat) => {
          const hasChildren = !!cat.children?.length;

          if (hasChildren) {
            return (
              <li key={cat._id} role="none" className="list-none">
                <div
                  className={cn(
                    'overflow-hidden rounded-2xl bg-gray-100',
                    'ring-offset-background transition-shadow focus-within:ring-2 focus-within:ring-ring',
                  )}
                >
                  <div className="relative flex w-full items-center gap-1 p-1">
                    <Link
                      href={productCategoryHref(cat._id)}
  
                         onClick={() => setNavigationStack((prev) => [...prev, cat])}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left active:bg-muted/50"
                    >
                      <CategoryIcon
                        category={cat}
                        size={65}
                        className="h-16 shrink-0 rounded-xl bg-white"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-roboto text-base leading-tight font-semibold">
                          {cat.name}
                        </p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white"
                      aria-label={`Открыть подкатегории «${cat.name}»`}
                      onClick={() => setNavigationStack((prev) => [...prev, cat])}
                    >
                      <ChevronRight className="size-5" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            );
          }

          return (
            <li key={cat._id} role="none" className="list-none">
              <Link
                href={productCategoryHref(cat._id)}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm',
                  'active:bg-muted/60 motion-safe:transition-colors',
                  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                )}
              >
                <CategoryIcon category={cat} size={40} className="shrink-0 rounded-xl shadow-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base leading-tight font-semibold">{cat.name}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col ">
      <header
        className={cn(
          'sticky top-0 z-30 shrink-0 bg-gray-100 ',
          'pt-[max(0.5rem,env(safe-area-inset-top))]',
        )}
      >
        <div className="flex items-center gap-1 px-2 pb-2 pt-1">
          <div className="w-10 shrink-0">
            {currentLevel > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 shrink-0 rounded-full border-none shadow-none"
                onClick={goBack}
                aria-label="Назад к предыдущему уровню"
              >
                <ChevronLeft className="size-6" aria-hidden />
              </Button>
            ) : (
              <span className="block size-10 shrink-0" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1 px-1 text-center">
            <h2 className="truncate font-roboto text-xl font-bold tracking-tight">{headerTitle}</h2>
            {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-full shadow-none border-none "
            onClick={onClose}
            aria-label="Закрыть каталог"
          >
            <X className="size-5" aria-hidden />
          </Button>
        </div>
        {!isLoading && !isError && roots.length > 0 ? (
          <div className="px-3 pb-2">
            <BreadcrumbTrail stack={navigationStack} onJump={jumpToDepth} />
          </div>
        ) : null}
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {currentLevel > 0 && !isLoading && !isError && roots.length > 0 ? (
          <div className="sticky top-0 z-20 border-b border-border/60 bg-background px-3 py-2">
            <Button
              type="button"
              variant="secondary"
              className="h-11 w-full justify-start gap-2 rounded-xl text-left font-medium "
              onClick={goBack}
            >
              <ChevronLeft className="size-5 shrink-0 opacity-80" aria-hidden />
              Назад к предыдущему уровню
            </Button>
          </div>
        ) : null}
        {body}
      </div>
    </div>
  );
}

function pluralRu(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
