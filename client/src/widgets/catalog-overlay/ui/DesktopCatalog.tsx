'use client';

import { useCategories } from '@/entities/category';
import type { Category } from '@/entities/category/model/types';
import { cn } from '@/shared/lib/utils';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { megaMenuNeedsFourthColumn } from '../lib/category-tree';
import { findCategoryPathById, useCatalogState } from '../model/useCatalogState';
import { CatalogEmptyPanel, CatalogErrorPanel, DesktopCatalogSkeleton } from './catalog-shared';
import { CategoryIcon } from './CategoryIcon';

type DesktopCatalogProps = {
  initialCategory?: string;
  onClose: () => void;
};

function productCategoryHref(id: string) {
  return `/products?category=${encodeURIComponent(String(id))}`;
}

function ColumnHeader({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-border/70 bg-background px-3 py-3 md:px-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground md:text-[11px]">
        {title}
      </p>
      {subtitle ? (
        <p className="mt-1 line-clamp-2 text-sm font-bold leading-tight text-foreground md:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function EmptyColumnHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100px] flex-1 items-center justify-center px-3 py-6 text-center text-xs text-muted-foreground md:text-sm">
      {children}
    </div>
  );
}

type CatalogSplitRowProps = {
  cat: Category;
  rowClass: string;
  onClose: () => void;
  onHover?: () => void;
  onDrill?: () => void;
  showIcon?: boolean;
  chevronSize?: number;
};

function CatalogSplitRow({
  cat,
  rowClass,
  onClose,
  onHover,
  onDrill,
  showIcon = false,
  chevronSize = 16,
}: CatalogSplitRowProps) {
  const hasChildren = !!cat.children?.length;
  const hoverHandlers = onHover
    ? {
        onMouseEnter: onHover,
        onFocus: onHover,
      }
    : undefined;

  if (!hasChildren) {
    return (
      <Link
        href={productCategoryHref(cat._id)}
        onClick={onClose}
        className={rowClass}
        {...hoverHandlers}
      >
        {showIcon ? <CategoryIcon category={cat} size={24} /> : null}
        <span className="min-w-0 flex-1 truncate">{cat.name}</span>
      </Link>
    );
  }

  return (
    <div className={rowClass} {...hoverHandlers}>
      <Link
        href={productCategoryHref(cat._id)}
        onClick={onClose}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 text-inherit no-underline outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      >
        {showIcon ? <CategoryIcon category={cat} size={24} /> : null}
        <span className="min-w-0 flex-1 truncate">{cat.name}</span>
      </Link>
      <button
        type="button"
        className="flex shrink-0 items-center justify-center rounded-md p-1 text-muted-foreground opacity-80 hover:bg-muted/80 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={`Открыть подкатегории «${cat.name}»`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDrill?.();
        }}
      >
        <ChevronRight size={chevronSize} aria-hidden />
      </button>
    </div>
  );
}

export function DesktopCatalog({ initialCategory, onClose }: DesktopCatalogProps) {
  const { data: categories, isLoading, isError, error, refetch } = useCategories();
  const roots = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
  const { selectedL1, selectedL2, selectedL3, setSelectedL1, setSelectedL2, setSelectedL3 } =
    useCatalogState(roots, initialCategory);

  const [hoverL1, setHoverL1] = useState<string | null>(null);
  const [hoverL2, setHoverL2] = useState<string | null>(null);
  const [hoverL3, setHoverL3] = useState<string | null>(null);

  const activePath = useMemo(
    () => (initialCategory ? findCategoryPathById(roots, initialCategory) : []),
    [roots, initialCategory],
  );

  const showFourthColumn = useMemo(() => megaMenuNeedsFourthColumn(roots), [roots]);

  const contentL1Id = hoverL1 ?? selectedL1 ?? roots[0]?._id ?? null;
  const effectiveL1Node = useMemo(
    () => roots.find((c) => String(c._id) === String(contentL1Id)),
    [roots, contentL1Id],
  );
  const level2Categories = effectiveL1Node?.children ?? [];

  const pinnedL2InColumn = useMemo(() => {
    if (!selectedL2) return null;
    return level2Categories.find((c) => String(c._id) === String(selectedL2)) ?? null;
  }, [level2Categories, selectedL2]);

  const contentL2IdCandidate = hoverL2 ?? selectedL2;
  const effectiveL2Node = useMemo(() => {
    if (!contentL2IdCandidate) return pinnedL2InColumn;
    const hit = level2Categories.find((c) => String(c._id) === String(contentL2IdCandidate));
    return hit ?? pinnedL2InColumn;
  }, [contentL2IdCandidate, level2Categories, pinnedL2InColumn]);

  const level3Categories = effectiveL2Node?.children ?? [];

  const pinnedL3InColumn = useMemo(() => {
    if (!selectedL3) return null;
    return level3Categories.find((c) => String(c._id) === String(selectedL3)) ?? null;
  }, [level3Categories, selectedL3]);

  const contentL3IdCandidate = hoverL3 ?? selectedL3;
  const effectiveL3Node = useMemo(() => {
    if (!contentL3IdCandidate) return pinnedL3InColumn;
    const hit = level3Categories.find((c) => String(c._id) === String(contentL3IdCandidate));
    return hit ?? pinnedL3InColumn;
  }, [contentL3IdCandidate, level3Categories, pinnedL3InColumn]);

  const level4Categories = effectiveL3Node?.children ?? [];

  const clearHover = useCallback(() => {
    setHoverL1(null);
    setHoverL2(null);
    setHoverL3(null);
  }, []);

  if (isLoading) {
    const skeletonRoots = Array.isArray(categories) ? categories : [];
    return <DesktopCatalogSkeleton fourColumns={megaMenuNeedsFourthColumn(skeletonRoots)} />;
  }

  if (isError) {
    return (
      <CatalogErrorPanel
        message={error instanceof Error ? error.message : undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  if (roots.length === 0) {
    return <CatalogEmptyPanel />;
  }

  const gridCols = showFourthColumn
    ? 'sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-1'
    : 'sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-1';

  return (
    <div
      className={cn(
        'grid h-full min-h-0 w-full grid-cols-1 gap-0 lg:divide-x lg:divide-border/70',
        gridCols,
      )}
      onMouseLeave={clearHover}
    >
      {/* Колонка 1 */}
      <div className="flex min-h-0 min-w-0 flex-col border-b border-border/70 lg:border-b-0">
        <ColumnHeader title="Категории" />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {roots.map((cat: Category) => {
            const isContextActive =
              !!activePath[0] && String(activePath[0]._id) === String(cat._id);
            const isHoverHere = hoverL1 !== null && String(hoverL1) === String(cat._id);
            const isHoverPreview = isHoverHere && !isContextActive;

            const rowClass = cn(
              'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors duration-150 md:px-4 md:py-3',
              'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isContextActive &&
                'bg-primary/12 font-semibold text-primary lg:border-l-[3px] lg:border-l-primary',
              !isContextActive && 'lg:border-l-[3px] lg:border-l-transparent',
              isHoverPreview && 'bg-muted/80 text-foreground',
              !isContextActive && !isHoverPreview && 'hover:bg-muted/60',
            );

            return (
              <CatalogSplitRow
                key={cat._id}
                cat={cat}
                rowClass={rowClass}
                onClose={onClose}
                showIcon
                chevronSize={18}
                onHover={() => {
                  setHoverL1(cat._id);
                  setHoverL2(null);
                  setHoverL3(null);
                }}
                onDrill={() => {
                  setSelectedL1(cat._id);
                  setHoverL1(cat._id);
                  setHoverL2(null);
                  setHoverL3(null);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Колонка 2 */}
      <div className="flex min-h-0 min-w-0 flex-col border-b border-border/70 lg:border-b-0">
        <ColumnHeader title="Подкатегории" subtitle={effectiveL1Node?.name ?? null} />
        <div
          key={String(contentL1Id)}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-100 min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {!effectiveL1Node ? (
            <EmptyColumnHint>Выберите категорию слева</EmptyColumnHint>
          ) : level2Categories.length === 0 ? (
            <div className="flex flex-col gap-3 p-4">
              <p className="text-center text-sm text-muted-foreground">
                Нет подкатегорий — сразу список товаров
              </p>
              <Link
                href={productCategoryHref(effectiveL1Node._id)}
                onClick={onClose}
                className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Перейти в «{effectiveL1Node.name}»
              </Link>
            </div>
          ) : (
            level2Categories.map((cat) => {
              const isContextActive =
                !!activePath[1] && String(activePath[1]._id) === String(cat._id);
              const isHoverHere = hoverL2 !== null && String(hoverL2) === String(cat._id);
              const isHoverPreview = isHoverHere && !isContextActive;

              const rowClass = cn(
                'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors duration-150 md:px-4 md:py-2.5',
                'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isContextActive && 'bg-primary/12 font-semibold text-primary',
                isHoverPreview && 'bg-muted/80',
                !isContextActive && !isHoverPreview && 'hover:bg-muted/60',
              );

              return (
                <CatalogSplitRow
                  key={cat._id}
                  cat={cat}
                  rowClass={rowClass}
                  onClose={onClose}
                  onHover={() => {
                    setHoverL2(cat._id);
                    setHoverL3(null);
                  }}
                  onDrill={() => {
                    setSelectedL2(cat._id);
                    setHoverL2(cat._id);
                    setHoverL3(null);
                  }}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Колонка 3 */}
      <div className="flex min-h-0 min-w-0 flex-col border-b border-border/70 lg:border-b-0">
        <ColumnHeader title="Разделы" subtitle={effectiveL2Node?.name ?? null} />
        <div
          key={`${String(contentL1Id)}-${String(effectiveL2Node?._id ?? '')}`}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-100 min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {!effectiveL2Node ? (
            <EmptyColumnHint>
              {level2Categories.length
                ? 'Наведите или выберите подкатегорию'
                : 'Недоступно для этой категории'}
            </EmptyColumnHint>
          ) : level3Categories.length === 0 ? (
            <div className="flex flex-col gap-3 p-4">
              <p className="text-center text-sm text-muted-foreground">Подразделов нет</p>
              <Link
                href={productCategoryHref(effectiveL2Node._id)}
                onClick={onClose}
                className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Все товары в «{effectiveL2Node.name}»
              </Link>
            </div>
          ) : (
            level3Categories.map((cat) => {
              const isContextActive =
                !!activePath[2] && String(activePath[2]._id) === String(cat._id);
              const isHoverHere = hoverL3 !== null && String(hoverL3) === String(cat._id);
              const isHoverPreview = isHoverHere && !isContextActive;

              const rowClass = cn(
                'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors duration-150 md:px-4 md:py-2.5',
                'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isContextActive && 'bg-primary/15 font-semibold text-primary',
                isHoverPreview && 'bg-primary/10 font-medium',
                !isContextActive && !isHoverPreview && 'hover:bg-muted/60',
              );

              return (
                <CatalogSplitRow
                  key={cat._id}
                  cat={cat}
                  rowClass={rowClass}
                  onClose={onClose}
                  onHover={() => setHoverL3(cat._id)}
                  onDrill={() => {
                    setSelectedL3(cat._id);
                    setHoverL3(cat._id);
                  }}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Колонка 4 — только если в дереве есть уровень с детьми */}
      {showFourthColumn ? (
        <div className="flex min-h-0 min-w-0 flex-col">
          <ColumnHeader title="Подразделы" subtitle={effectiveL3Node?.name ?? null} />
          <div
            key={`${String(contentL1Id)}-${String(effectiveL2Node?._id ?? '')}-${String(effectiveL3Node?._id ?? '')}`}
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-100 min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            {!effectiveL3Node ? (
              <EmptyColumnHint>
                {level3Categories.length ? 'Наведите раздел слева' : 'Недоступно для этой ветки'}
              </EmptyColumnHint>
            ) : level4Categories.length === 0 ? (
              <div className="flex flex-col gap-3 p-4">
                <p className="text-center text-sm text-muted-foreground">Это конечная категория</p>
                <Link
                  href={productCategoryHref(effectiveL3Node._id)}
                  onClick={onClose}
                  className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Товары в «{effectiveL3Node.name}»
                </Link>
              </div>
            ) : (
              level4Categories.map((cat) => {
                const isLeafActive =
                  !!initialCategory && String(initialCategory) === String(cat._id);

                return (
                  <Link
                    key={cat._id}
                    href={productCategoryHref(cat._id)}
                    onClick={onClose}
                    onFocus={() => {
                      if (effectiveL3Node) setHoverL3(effectiveL3Node._id);
                    }}
                    className={cn(
                      'block px-3 py-2 text-sm transition-colors duration-150 md:px-4 md:py-2.5',
                      'hover:bg-muted/70 hover:text-primary',
                      'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                      isLeafActive && 'bg-primary/10 font-semibold text-primary',
                    )}
                  >
                    {cat.name}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
