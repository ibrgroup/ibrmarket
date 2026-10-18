import type { Category } from '../model/types';

/**
 * Разворачивает дерево категорий из API в плоский список (корень → листья).
 * Нужно для фильтров и ссылок: товары привязаны к конкретной категории (часто листу).
 */
export function flattenCategoryTree(nodes: Category[] | undefined | null): Category[] {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];
  const out: Category[] = [];
  const walk = (n: Category) => {
    out.push(n);
    const kids = n.children;
    if (Array.isArray(kids) && kids.length > 0) {
      kids.forEach(walk);
    }
  };
  nodes.forEach(walk);
  return out;
}

/**
 * Находит путь к категории (массив ID от корня до целевой категории)
 */
export function findCategoryPath(
  categories: Category[],
  targetId: string,
  currentPath: string[] = [],
): string[] | null {
  for (const category of categories) {
    const newPath = [...currentPath, category._id];

    if (category._id === targetId) {
      return newPath;
    }

    if (category.children && category.children.length > 0) {
      const found = findCategoryPath(category.children, targetId, newPath);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Находит категорию по имени (slug)
 */
export function findCategoryByName(categories: Category[], name: string): Category | null {
  const normalizedName = name.toLowerCase().replace(/\s+/g, '-');

  for (const category of categories) {
    const categorySlug = category.name?.toLowerCase().replace(/\s+/g, '-') || '';
    if (categorySlug === normalizedName) {
      return category;
    }

    if (category.children && category.children.length > 0) {
      const found = findCategoryByName(category.children, name);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Проверяет, является ли категория активной (по имени/slug)
 */
export function isCategoryActive(category: Category, activeCategoryName?: string | null): boolean {
  if (!activeCategoryName) return false;

  // Поддержка активной категории как по ID (ObjectId), так и по slug/названию.
  // Это важно, т.к. фильтры каталога используют ID, а человек может вставить slug в URL вручную.
  if (String(category._id) === String(activeCategoryName)) {
    return true;
  }

  const categorySlug = category.name?.toLowerCase().replace(/\s+/g, '-') || '';
  const activeSlug = activeCategoryName.toLowerCase().replace(/\s+/g, '-');

  return categorySlug === activeSlug;
}
