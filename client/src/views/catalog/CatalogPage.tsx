'use client';

import { CategoryItem, useCategories, useCategoryState, type Category } from '@/entities/category';
import { Button } from '@/shared/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { AiOutlineAppstore } from 'react-icons/ai';

export function CatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories, isLoading } = useCategories();
  const { expandedCategories, toggleCategory } = useCategoryState();

  const activeCategory = useMemo(() => searchParams?.get('category') || null, [searchParams]);

  const handleCategoryClick = (category: Category) => {
    router.push(`/products?category=${encodeURIComponent(String(category._id))}`);
  };

  return (
    <div className="max-container mx-auto px-4 py-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 flex h-11 w-11 items-center justify-center rounded-xl">
            <AiOutlineAppstore className="text-indigo-500 size-7" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-foreground text-2xl font-bold leading-tight">Каталог</h1>
            <p className="text-muted-foreground text-sm">
              Выберите категорию и подкатегорию — откроется список товаров.
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => router.push('/products')}>
          Открыть товары
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <p className="text-muted-foreground text-sm">Все категории</p>
        </div>

        <div className="p-3 sm:p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted h-11 w-11 animate-pulse rounded-xl" />
                    <div className="flex-1">
                      <div className="bg-muted mb-2 h-4 w-40 animate-pulse rounded" />
                      <div className="bg-muted h-3 w-24 animate-pulse rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {(categories || []).map((category, index) => (
                <CategoryItem
                  key={category._id}
                  category={category}
                  onCategoryClick={handleCategoryClick}
                  expandedCategories={expandedCategories}
                  onToggleExpanded={toggleCategory}
                  activeCategoryName={activeCategory}
                  className="animate-in fade-in slide-in-from-left-2"
                  style={{
                    animationDelay: `${index * 25}ms`,
                    animationFillMode: 'backwards',
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
