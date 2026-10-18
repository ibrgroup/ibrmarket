'use client';

import {
  CategoryItem,
  findCategoryPath,
  useCategories,
  useCategoryState,
  type Category,
} from '@/entities/category';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type FC } from 'react';
import { AiOutlineAppstore } from 'react-icons/ai';

/**
 * Мобильная версия каталога товаров
 *
 * @description Оптимизированный Sheet для мобильных устройств
 * @features
 * - Fullscreen на мобильных
 * - Плавные анимации
 * - Оптимизированная загрузка категорий
 */
export const MobileCatalogSheet: FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories, isLoading } = useCategories();
  const { expandedCategories, expandCategoryPath, toggleCategory } = useCategoryState();

  // Получаем активную категорию из URL
  const activeCategoryName = useMemo(() => searchParams?.get('category') || null, [searchParams]);

  // Автоматически раскрываем путь к активной категории
  useEffect(() => {
    if (categories && activeCategoryName && open) {
      const findCategory = (cats: Category[], value: string): Category | null => {
        for (const cat of cats) {
          if (String(cat._id) === String(value)) return cat;
          const catSlug = cat.name?.toLowerCase().replace(/\s+/g, '-') || '';
          const activeSlug = value.toLowerCase().replace(/\s+/g, '-');
          if (catSlug === activeSlug) return cat;
          if (cat.children) {
            const found = findCategory(cat.children, value);
            if (found) return found;
          }
        }
        return null;
      };

      const activeCategory = findCategory(categories, activeCategoryName);
      if (activeCategory) {
        const path = findCategoryPath(categories, activeCategory._id);
        if (path) {
          expandCategoryPath(path);
        }
      }
    }
  }, [categories, activeCategoryName, open, expandCategoryPath]);

  const handleCategoryClick = (category: Category) => {
    const id = category._id;
    if (id) {
      router.push(`/products?category=${encodeURIComponent(String(id))}`);
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'hover:bg-indigo-500/10 group relative flex h-11 w-11 items-center',
            'justify-center rounded-full transition focus-visible:ring-2',
            'focus-visible:ring-indigo-500/50 md:hidden',
          )}
          aria-label="Открыть каталог"
        >
          <AiOutlineAppstore className="text-indigo-500 size-7 transition-transform duration-200 group-hover:scale-110" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className={cn(
          'w-full md:max-w-md',
          'bg-background border-border flex h-full flex-col border-r p-0',
        )}
        aria-label="Каталог товаров"
      >
        {/* Заголовок */}
        <SheetHeader className="border-border border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-foreground flex items-center gap-3 text-xl font-bold">
              <div className="bg-indigo-500/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <AiOutlineAppstore className="text-indigo-500 size-7" />
              </div>
              <span>Каталог</span>
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Список категорий */}
        <nav aria-label="Категории товаров" className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted h-12 w-12 animate-pulse rounded-xl" />
                    <div className="flex-1">
                      <div className="bg-muted mb-2 h-4 w-32 animate-pulse rounded" />
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
                  activeCategoryName={activeCategoryName}
                  className="animate-in fade-in slide-in-from-left-4"
                  style={{
                    animationDelay: `${index * 30}ms`,
                    animationFillMode: 'backwards',
                  }}
                />
              ))}
            </ul>
          )}
        </nav>
        <SheetFooter className="border-t border-border bg-muted/30 px-4 py-4">
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl font-semibold text-base transition-colors hover:bg-indigo-500/10 active:bg-indigo-500/20"
            aria-label="Закрыть"
            onClick={() => setOpen(false)}
          >
            Закрыть каталог
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
