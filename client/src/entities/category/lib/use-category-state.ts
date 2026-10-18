'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'category-expanded-state';

/**
 * Хук для сохранения и восстановления состояния раскрытых категорий
 */
export function useCategoryState() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Загружаем состояние из localStorage при монтировании
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setExpandedCategories(new Set(parsed));
      }
    } catch (error) {
      console.warn('Failed to load category state from localStorage:', error);
    }
  }, []);

  // Сохраняем состояние в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(expandedCategories)));
    } catch (error) {
      console.warn('Failed to save category state to localStorage:', error);
    }
  }, [expandedCategories]);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const setCategoryExpanded = useCallback((categoryId: string, expanded: boolean) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (expanded) {
        next.add(categoryId);
      } else {
        next.delete(categoryId);
      }
      return next;
    });
  }, []);

  const isCategoryExpanded = useCallback(
    (categoryId: string) => expandedCategories.has(categoryId),
    [expandedCategories],
  );

  const expandCategoryPath = useCallback((categoryIds: string[]) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      categoryIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const clearState = useCallback(() => {
    setExpandedCategories(new Set());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear category state from localStorage:', error);
    }
  }, []);

  return {
    expandedCategories,
    toggleCategory,
    setCategoryExpanded,
    isCategoryExpanded,
    expandCategoryPath,
    clearState,
  };
}
