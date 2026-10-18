import type { Category } from '@/entities/category';
import type { CategoryFilter } from '../model/types';

/**
 * Строит дерево фильтров из дерева категорий API.
 */
export function buildCategoryFilterTree(nodes: Category[] | undefined | null): CategoryFilter[] {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];

  return nodes
    .filter((node) => node?._id && node?.name)
    .map((node) => {
      const children =
        Array.isArray(node.children) && node.children.length > 0
          ? buildCategoryFilterTree(node.children)
          : undefined;
      return {
        value: String(node._id),
        label: String(node.name),
        ...(children && children.length > 0 ? { children } : {}),
      };
    });
}

/** Есть ли вложенные подкатегории (нужен пункт «Ещё» в чипсах). */
export function categoryTreeHasNestedNodes(tree: CategoryFilter[]): boolean {
  return tree.some((node) => Array.isArray(node.children) && node.children.length > 0);
}

/**
 * Плоский список для подписей активных фильтров и чипсов.
 */
export function flattenCategoryFilters(tree: CategoryFilter[]): CategoryFilter[] {
  const out: CategoryFilter[] = [];
  const walk = (nodes: CategoryFilter[]) => {
    for (const node of nodes) {
      out.push({
        value: node.value,
        label: node.label,
        count: node.count,
      });
      if (node.children?.length) walk(node.children);
    }
  };
  walk(tree);
  return out;
}

/** Только корневые категории (для горизонтальных чипсов). */
export function getRootCategoryFilters(tree: CategoryFilter[]): CategoryFilter[] {
  return tree.map(({ value, label, count }) => ({ value, label, count }));
}
