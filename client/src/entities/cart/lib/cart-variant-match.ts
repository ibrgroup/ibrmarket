import { defaultCatalogCartVariantFields } from '@/entities/product/lib/catalog-cart-variant';
import { productColorsRepresentSame } from '@/entities/product/lib/product-color-options';
import { productSizesRepresentSame } from '@/entities/product/lib/product-size-options';
import type { Product } from '@/entities/product/model/types';
import type { CartItem } from '../model/types';

export function normCartAttr(x: string | undefined | null): string {
  return x == null || x === '' ? '' : String(x);
}

export type CartVariantFields = Pick<CartItem, 'productId' | 'size' | 'color' | 'weight' | 'ram'>;

/**
 * Одна и та же торговая позиция (склейка количества при addItem, поиск строки на PDP / в quick view).
 */
export function cartLinesSameVariant(a: CartVariantFields, b: CartVariantFields): boolean {
  return (
    a.productId === b.productId &&
    productSizesRepresentSame(a.size, b.size) &&
    productColorsRepresentSame(a.color, b.color) &&
    normCartAttr(a.weight) === normCartAttr(b.weight) &&
    normCartAttr(a.ram) === normCartAttr(b.ram)
  );
}

/** Строка корзины совпадает с «дефолтным» вариантом товара из каталога / первой опцией на PDP. */
export function cartLineMatchesProductCatalogDefault(
  line: Pick<CartItem, 'productId' | 'size' | 'color' | 'weight' | 'ram'>,
  product: Product,
): boolean {
  if (line.productId !== product._id) return false;
  const defaults = defaultCatalogCartVariantFields(product);
  return cartLinesSameVariant(
    {
      productId: line.productId,
      size: line.size,
      color: line.color,
      weight: line.weight ?? '',
      ram: line.ram ?? '',
    },
    {
      productId: product._id,
      ...defaults,
    },
  );
}
