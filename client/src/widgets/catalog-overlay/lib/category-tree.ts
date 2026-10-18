import type { Category } from '@/entities/category/model/types';

/** Нужна ли 4-я колонка мегаменю (есть хотя бы один узел глубины 4 с детьми). */
export function megaMenuNeedsFourthColumn(roots: Category[]): boolean {
  for (const l1 of roots) {
    for (const l2 of l1.children ?? []) {
      for (const l3 of l2.children ?? []) {
        if (l3.children?.length) return true;
      }
    }
  }
  return false;
}
