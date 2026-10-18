import type { Product } from '../model/types';

export type CatalogCartVariantDefaults = {
  size: string;
  color: string;
  weight: string;
  ram: string;
};

function firstNonEmptyFromList(arr?: (string | null)[] | null): string {
  if (!Array.isArray(arr)) return '';
  for (const x of arr) {
    const s = String(x ?? '').trim();
    if (s) return s;
  }
  return '';
}

/**
 * Значения варианта «как в каталоге / по умолчанию на PDP»: первый размер и первый цвет из списка.
 * Вес и RAM на PDP в корзину не кладём — пустые строки (совпадает с matchingLine на ProductPage).
 */
export function defaultCatalogCartVariantFields(product: Product): CatalogCartVariantDefaults {
  return {
    size: firstNonEmptyFromList(product.size),
    color: firstNonEmptyFromList(product.colors),
    weight: '',
    ram: '',
  };
}
