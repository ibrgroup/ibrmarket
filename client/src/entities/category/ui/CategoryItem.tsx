'use client';

import { cn } from '@/shared/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FC, useMemo } from 'react';
import { AiOutlineAppstore } from 'react-icons/ai';
import { GoChevronDown, GoChevronRight } from 'react-icons/go';
import { isCategoryActive } from '../lib/category-utils';
import { useCategoryState } from '../lib/use-category-state';
import type { Category } from '../model/types';

interface CategoryItemProps {
  category: Category;
  level?: number;
  onCategoryClick?: (category: Category) => void;
  className?: string;
  style?: React.CSSProperties;
  expandedCategories?: Set<string>;
  onToggleExpanded?: (categoryId: string) => void;
  activeCategoryName?: string | null;
}

/**
 * Рекурсивный компонент для отображения категории с подкатегориями
 *
 * @param category - Категория для отображения
 * @param level - Уровень вложенности (для отступов)
 * @param onCategoryClick - Callback при клике на категорию
 * @param className - Дополнительные CSS классы
 * @param expandedCategories - Set раскрытых категорий (для сохранения состояния)
 * @param onToggleExpanded - Callback для переключения состояния раскрытия
 * @param activeCategoryName - Имя активной категории для подсветки
 */
export const CategoryItem: FC<CategoryItemProps> = ({
  category,
  level = 0,
  onCategoryClick,
  className,
  style,
  expandedCategories,
  onToggleExpanded,
  activeCategoryName,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCategoryExpanded, toggleCategory } = useCategoryState();

  // Определяем активную категорию из URL или пропсов
  const currentActiveCategory = useMemo(() => {
    return activeCategoryName || searchParams?.get('category') || null;
  }, [activeCategoryName, searchParams]);

  const isActive = useMemo(
    () => isCategoryActive(category, currentActiveCategory),
    [category, currentActiveCategory],
  );

  // Используем внешнее состояние или внутреннее
  const isExpanded = expandedCategories
    ? expandedCategories.has(category._id)
    : isCategoryExpanded(category._id);

  const handleToggleExpanded = onToggleExpanded || (() => toggleCategory(category._id));

  const hasChildren = category.children && category.children.length > 0;

  const handleCategoryClick = () => {
    if (onCategoryClick) {
      onCategoryClick(category);
    } else {
      // Дефолтное поведение - переход на страницу категории
      const id = category._id;
      if (id) {
        // В URL кладём ID — фильтры и API ожидают идентификаторы категорий.
        router.push(`/products?category=${encodeURIComponent(String(id))}`);
      }
    }
  };

  const paddingLeft = level * 16;

  const categoryVisual = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            'bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
            level > 0 && 'h-8 w-8',
            isActive && 'bg-primary/20 ring-2 ring-primary/30',
          )}
        >
          {category.images?.[0] ? (
            <img
              src={category.images[0]}
              alt={category.name}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <AiOutlineAppstore size={level > 0 ? 16 : 20} aria-hidden className="text-primary" />
          )}
        </div>
        <span
          className={cn(
            'text-foreground truncate font-medium',
            level > 0 && 'text-sm',
            isActive && 'font-semibold text-primary',
          )}
        >
          {category.name}
        </span>
      </div>
    </>
  );

  const expandButton = (
    <div className="bg-muted flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
      {isExpanded ? (
        <GoChevronDown
          size={14}
          className="text-muted-foreground transition-transform duration-200"
          aria-hidden="true"
        />
      ) : (
        <GoChevronRight
          size={14}
          className="text-muted-foreground transition-transform duration-200"
          aria-hidden="true"
        />
      )}
    </div>
  );

  if (!hasChildren) {
    return (
      <li className={cn('group', className)} style={style}>
        <button
          type="button"
          onClick={handleCategoryClick}
          className={cn(
            'hover:bg-accent flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg p-3 text-left transition-colors duration-200',
            level > 0 && 'rounded-md',
            isActive && 'bg-primary/10 border-l-2 border-primary',
          )}
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
          aria-label={`Перейти к категории ${category.name}`}
          aria-current={isActive ? 'page' : undefined}
        >
          {categoryVisual}
          <div className="bg-muted flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
            <GoChevronRight size={14} className="text-muted-foreground" aria-hidden="true" />
          </div>
        </button>
      </li>
    );
  }

  return (
    <li className={cn('group', className)} style={style}>
      <Collapsible
        open={isExpanded}
        onOpenChange={(open) => {
          if (open !== isExpanded) {
            handleToggleExpanded(category._id);
          }
        }}
      >
        <div
          className={cn(
            'hover:bg-accent flex w-full items-center gap-1 rounded-lg transition-colors duration-200',
            level > 0 && 'rounded-md',
            isActive && 'bg-primary/10 border-l-2 border-primary',
          )}
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
        >
          <button
            type="button"
            onClick={handleCategoryClick}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg p-3 text-left"
            aria-label={`Искать в категории ${category.name}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {categoryVisual}
          </button>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="mr-3 flex shrink-0 cursor-pointer items-center justify-center rounded-full p-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              aria-label={`Открыть подкатегории «${category.name}»`}
            >
              {expandButton}
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <ul className="space-y-1 pt-1">
            {category.children?.map((child) => (
              <CategoryItem
                key={child._id}
                category={child}
                level={level + 1}
                onCategoryClick={onCategoryClick}
                expandedCategories={expandedCategories}
                onToggleExpanded={onToggleExpanded}
                activeCategoryName={currentActiveCategory}
              />
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
};
