import { ORDER_STATUS, type OrderStatus } from '../model/types';

/** Допустимые переходы (зеркало server/utils/orderStatus.js). */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [ORDER_STATUS.WAITING_PAYMENT]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.REFUSED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.REFUSED]: [],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Статусы для select: текущий + допустимые следующие. */
export function getSelectableOrderStatuses(current: OrderStatus): OrderStatus[] {
  const next = ORDER_STATUS_TRANSITIONS[current] ?? [];
  return [current, ...next.filter((s) => s !== current)];
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return (ORDER_STATUS_TRANSITIONS[status]?.length ?? 0) === 0;
}
