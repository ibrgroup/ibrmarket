import type { OrderProduct } from '@/entities/order/model/types';

export const ORDER_ITEM_RETURN_REASON = {
  RETURNED: 'RETURNED',
  REFUSED: 'REFUSED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderItemReturnReason =
  (typeof ORDER_ITEM_RETURN_REASON)[keyof typeof ORDER_ITEM_RETURN_REASON];

export const ORDER_ITEM_LINE_STATUS = {
  ACTIVE: 'ACTIVE',
  PARTIAL: 'PARTIAL',
  RETURNED: 'RETURNED',
  REFUSED: 'REFUSED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderItemLineStatus =
  (typeof ORDER_ITEM_LINE_STATUS)[keyof typeof ORDER_ITEM_LINE_STATUS];

export function getOrderLineId(line: OrderProduct, fallbackIndex: number): string {
  if (line._id) return line._id;
  return `${line.productId}-${fallbackIndex}`;
}

export function getActiveLineQuantity(line: OrderProduct, orderStatus?: string): number {
  const st = String(orderStatus || '').toUpperCase();
  if (st === 'CANCELLED' || st === 'REFUSED') return 0;
  const qty = Math.max(0, Number(line.quantity) || 0);
  const returned = Math.max(0, Number(line.returnedQuantity) || 0);
  return Math.max(0, qty - returned);
}

export function getLineUnitPrice(line: OrderProduct): number {
  const qty = Math.max(0, Number(line.quantity) || 0);
  const sub = Number(line.subTotal);
  if (qty > 0 && Number.isFinite(sub) && sub > 0) return sub / qty;
  return Math.max(0, Number(line.price) || 0);
}

export function getRemainingLineAmount(line: OrderProduct, orderStatus?: string): number {
  return (
    Math.round(getLineUnitPrice(line) * getActiveLineQuantity(line, orderStatus) * 100) / 100
  );
}

export function deriveLineStatus(line: OrderProduct, orderStatus?: string): OrderItemLineStatus {
  const ost = String(orderStatus || '').toUpperCase();
  if (ost === 'CANCELLED') return ORDER_ITEM_LINE_STATUS.CANCELLED;
  if (ost === 'REFUSED') return ORDER_ITEM_LINE_STATUS.REFUSED;
  const qty = Math.max(0, Number(line.quantity) || 0);
  const returned = Math.max(0, Number(line.returnedQuantity) || 0);
  if (returned <= 0) return ORDER_ITEM_LINE_STATUS.ACTIVE;
  if (returned >= qty) {
    const reason = String(line.returnReason || '').toUpperCase();
    if (reason === ORDER_ITEM_RETURN_REASON.REFUSED) return ORDER_ITEM_LINE_STATUS.REFUSED;
    if (reason === ORDER_ITEM_RETURN_REASON.CANCELLED) return ORDER_ITEM_LINE_STATUS.CANCELLED;
    return ORDER_ITEM_LINE_STATUS.RETURNED;
  }
  return ORDER_ITEM_LINE_STATUS.PARTIAL;
}

export function getLineStatusLabel(status: OrderItemLineStatus, reason?: string): string {
  if (status === ORDER_ITEM_LINE_STATUS.PARTIAL) {
    const r = String(reason || '').toUpperCase();
    if (r === ORDER_ITEM_RETURN_REASON.CANCELLED) return 'Частично отменена';
    if (r === ORDER_ITEM_RETURN_REASON.REFUSED) return 'Частичный отказ';
    return 'Частичный возврат';
  }
  switch (status) {
    case ORDER_ITEM_LINE_STATUS.ACTIVE:
      return 'Активна';
    case ORDER_ITEM_LINE_STATUS.RETURNED:
      return 'Возвращена';
    case ORDER_ITEM_LINE_STATUS.REFUSED:
      return 'Отказ';
    case ORDER_ITEM_LINE_STATUS.CANCELLED:
      return 'Отменена';
    default:
      return status;
  }
}

export function getReturnReasonLabel(reason?: string): string {
  switch (String(reason || '').toUpperCase()) {
    case ORDER_ITEM_RETURN_REASON.RETURNED:
      return 'Возврат';
    case ORDER_ITEM_RETURN_REASON.REFUSED:
      return 'Отказ от получения';
    case ORDER_ITEM_RETURN_REASON.CANCELLED:
      return 'Отмена позиции';
    default:
      return '—';
  }
}

export function canPartialReturnOrderStatus(orderStatus: string): boolean {
  return (
    orderStatus === 'WAITING_PAYMENT' || orderStatus === 'PAID' || orderStatus === 'DELIVERED'
  );
}

/** Есть ли по заказу снятые/возвращённые единицы (частичный отказ из админки). */
export function hasOrderLineAdjustments(order: {
  order_status?: string | null;
  refundedAmount?: number | null;
  products?: OrderProduct[] | null;
}): boolean {
  const st = String(order.order_status || '').toUpperCase();
  if (st === 'CANCELLED' || st === 'REFUSED') return true;
  if (Number(order.refundedAmount || 0) > 0) return true;
  return (order.products ?? []).some((line) => Number(line.returnedQuantity || 0) > 0);
}
