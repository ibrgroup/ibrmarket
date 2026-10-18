'use client';

import type { Category } from '@/entities/category/model/types';
import { useCallback, useMemo, useRef, useState, type SetStateAction } from 'react';

function findCategoryPathById(categories: Category[], targetId: string): Category[] {
  const stack: Category[] = [];

  const dfs = (nodes: Category[]): boolean => {
    for (const node of nodes) {
      stack.push(node);
      if (String(node._id) === String(targetId)) return true;
      if (node.children?.length) {
        if (dfs(node.children)) return true;
      }
      stack.pop();
    }
    return false;
  };

  if (!targetId) return [];
  const found = dfs(categories);
  return found ? [...stack] : [];
}

type CatalogState = {
  selectedL1: string | null;
  selectedL2: string | null;
  selectedL3: string | null;
  navigationStack: Category[];
  setSelectedL1: (id: string) => void;
  setSelectedL2: (id: string | null) => void;
  setSelectedL3: (id: string | null) => void;
  setNavigationStack: (next: SetStateAction<Category[]>) => void;
};

/**
 * Единый хук состояния каталога:
 * - Desktop: selectedL1/selectedL2/selectedL3 (четвёртая колонка листьев)
 * - Mobile: navigationStack (drill-down)
 *
 * initialCategory: ожидает `_id` категории (у вас фильтры товаров принимают ID).
 */
export function useCatalogState(categories: Category[], initialCategory?: string): CatalogState {
  const [selectedL1Internal, setSelectedL1Internal] = useState<string | null>(null);
  const [selectedL2Internal, setSelectedL2Internal] = useState<string | null>(null);
  const [selectedL3Internal, setSelectedL3Internal] = useState<string | null>(null);
  const [navigationStackInternal, setNavigationStackInternal] = useState<Category[] | null>(null);

  const initialPath = useMemo(() => {
    if (!initialCategory) return [];
    return findCategoryPathById(categories, initialCategory);
  }, [categories, initialCategory]);

  const initialPathRef = useRef(initialPath);
  initialPathRef.current = initialPath;

  const selectedL1 = useMemo(() => {
    return selectedL1Internal ?? initialPath[0]?._id ?? null;
  }, [initialPath, selectedL1Internal]);

  const selectedL2 = useMemo(() => {
    // Если пользователь уже выбирал — уважим выбор
    if (selectedL2Internal !== null) return selectedL2Internal;
    return initialPath[1]?._id ?? null;
  }, [initialPath, selectedL2Internal]);

  const selectedL3 = useMemo(() => {
    if (selectedL3Internal !== null) return selectedL3Internal;
    return initialPath[2]?._id ?? null;
  }, [initialPath, selectedL3Internal]);

  const navigationStack = useMemo(() => {
    return navigationStackInternal ?? initialPath;
  }, [initialPath, navigationStackInternal]);

  /** Стабильная ссылка: не зависит от initialPath, чтобы эффекты в MobileCatalog не сбрасывали стек при первой загрузке дерева. */
  const setNavigationStack = useCallback((next: SetStateAction<Category[]>) => {
    setNavigationStackInternal((prevInternal) => {
      const base = prevInternal != null ? prevInternal : initialPathRef.current;
      return typeof next === 'function' ? next(base) : next;
    });
  }, []);

  return {
    selectedL1,
    selectedL2,
    selectedL3,
    navigationStack,
    setSelectedL1: (id: string) => {
      setSelectedL1Internal(id);
      setSelectedL2Internal(null);
      setSelectedL3Internal(null);
    },
    setSelectedL2: (id) => {
      setSelectedL2Internal(id);
      setSelectedL3Internal(null);
    },
    setSelectedL3: (id) => setSelectedL3Internal(id),
    setNavigationStack,
  };
}

export { findCategoryPathById };
