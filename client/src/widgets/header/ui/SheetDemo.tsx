'use client';

import {
  CategoryItem,
  findCategoryPath,
  useCategories,
  useCategoryState,
  type Category,
} from '@/entities/category';
import { Button } from '@/shared/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type FC } from 'react';
import { AiOutlineAppstore } from 'react-icons/ai';
import { IoClose } from 'react-icons/io5';

export const SheetDemo: FC = () => {
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
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          className="group bg-indigo-500 hover:bg-/90 focus:ring-indigo-500/50 flex items-center gap-3 rounded-xl px-4 py-5.5 font-medium text-white transition-all duration-200 focus:ring-2 focus:outline-none"
        >
          <span className="flex items-center justify-center">
            {open ? (
              <IoClose size={25} aria-hidden className="text-white" />
            ) : (
              <AiOutlineAppstore size={25} aria-hidden className="text-white" />
            )}
          </span>
          <span className="text-sm font-bold">Каталог</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        aria-label="Каталог товаров"
        className="bg-background border-border flex h-full flex-col border-r"
      >
        <SheetHeader className="border-border border-b pb-4">
          <SheetTitle className="text-foreground flex items-center gap-2 text-xl font-semibold">
            <AiOutlineAppstore className="text-indigo-500" size={24} />
            Каталог товаров
          </SheetTitle>
        </SheetHeader>

        <nav aria-label="Категории товаров" className="flex-1 space-y-1 overflow-y-auto px-2">
          {isLoading ? (
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted h-10 w-10 animate-pulse rounded-lg" />
                    <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {(categories || []).map((category) => (
                <CategoryItem
                  key={category._id}
                  category={category}
                  onCategoryClick={handleCategoryClick}
                  expandedCategories={expandedCategories}
                  onToggleExpanded={toggleCategory}
                  activeCategoryName={activeCategoryName}
                />
              ))}
            </ul>
          )}
        </nav>

        <SheetFooter className="border-border border-t pt-4">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              Закрыть каталог
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
