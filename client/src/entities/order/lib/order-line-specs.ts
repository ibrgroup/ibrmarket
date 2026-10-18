import { getProductColorVisual, type ProductColorVisual } from '@/entities/product/lib/product-color-options';
import { getProductSizeLabel } from '@/entities/product/lib/product-size-options';

import type { OrderProduct } from '../model/types';

export type OrderLineSpecRow = {
  key: string;
  label: string;
  value: string;
  colorVisual?: ProductColorVisual;
};

function nonempty(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

/** Подписи варианта из снимка позиции заказа (размер, цвет, RAM, вес, скидка). */
export function getOrderLineSpecRows(
  line: Pick<OrderProduct, 'size' | 'color' | 'ram' | 'weight' | 'discount'>,
): OrderLineSpecRow[] {
  const rows: OrderLineSpecRow[] = [];

  const size = nonempty(line.size);
  if (size) {
    rows.push({ key: 'size', label: 'Размер', value: getProductSizeLabel(size) });
  }

  const color = nonempty(line.color);
  if (color) {
    const visual = getProductColorVisual(color);
    rows.push({ key: 'color', label: 'Цвет', value: visual.label, colorVisual: visual });
  }

  const ram = nonempty(line.ram);
  if (ram) {
    rows.push({ key: 'ram', label: 'Память', value: ram });
  }

  const weight = nonempty(line.weight);
  if (weight) {
    rows.push({ key: 'weight', label: 'Вес', value: weight });
  }

  const discount = Number(line.discount);
  if (Number.isFinite(discount) && discount > 0) {
    rows.push({ key: 'discount', label: 'Скидка', value: `−${discount}%` });
  }

  return rows;
}

export function formatOrderLineSpecsPlain(
  line: Pick<OrderProduct, 'size' | 'color' | 'ram' | 'weight' | 'discount'>,
): string {
  return getOrderLineSpecRows(line)
    .map((r) => `${r.label}: ${r.value}`)
    .join(' · ');
}
