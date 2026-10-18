import type { Order } from '../model/types';
import { ORDER_STATUS } from '../model/types';
import {
  deriveLineStatus,
  getActiveLineQuantity,
  getRemainingLineAmount,
  type OrderItemLineStatus,
} from './order-line-return';

/** Одна позиция из истории покупок (для страницы «Мои покупки») */
export type PurchaseLine = {
  key: string;
  orderId: string;
  orderCreatedAt: string;
  orderStatus: Order['order_status'];
  lineIndex: number;
  productId: string;
  productTitle: string;
  quantity: number;
  originalQuantity: number;
  price: number;
  subTotal: number;
  originalSubTotal: number;
  lineStatus: OrderItemLineStatus;
  returnReason?: string;
  image?: string;
  brand?: string;
  size?: string;
  color?: string;
};

function isPurchaseHistoryOrder(order: Order): boolean {
  const st = order.order_status;
  if (st === ORDER_STATUS.WAITING_PAYMENT) return false;
  if (st === ORDER_STATUS.PAID || st === ORDER_STATUS.DELIVERED || st === ORDER_STATUS.REFUSED) {
    return true;
  }
  if (st !== ORDER_STATUS.CANCELLED) return false;
  if (order.payment_type === 'ON_DELIVERY') return true;
  if (order.paymentId) return true;
  if (Number(order.refundedAmount || 0) > 0) return true;
  return (order.products ?? []).some((p) => Number(p.returnedQuantity || 0) > 0);
}

/**
 * Разворачивает заказы в список позиций: купленные, частично снятые и отказные.
 * Неоплаченные (ожидают оплаты) не показываем.
 */
export function ordersToPurchaseLines(
  orders: Order[],
  options?: { includeWaitingPayment?: boolean },
): PurchaseLine[] {
  const includeWaiting = options?.includeWaitingPayment === true;
  const lines: PurchaseLine[] = [];
  const sorted = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  for (const order of sorted) {
    if (order.order_status === ORDER_STATUS.WAITING_PAYMENT) {
      if (!includeWaiting) continue;
    } else if (!isPurchaseHistoryOrder(order)) {
      continue;
    }

    const products = order.products ?? [];
    products.forEach((p, lineIndex) => {
      const originalQty = Math.max(0, Number(p.quantity) || 0);
      if (originalQty <= 0) return;
      const qty = getActiveLineQuantity(p, order.order_status);
      const originalSub = Number(p.subTotal) || p.price * originalQty;
      lines.push({
        key: `${order._id}-${lineIndex}-${p.productId}`,
        orderId: order._id,
        orderCreatedAt: order.createdAt,
        orderStatus: order.order_status,
        lineIndex,
        productId: p.productId,
        productTitle: p.productTitle,
        quantity: qty,
        originalQuantity: originalQty,
        price: p.price,
        subTotal: getRemainingLineAmount(p, order.order_status),
        originalSubTotal: originalSub,
        lineStatus: deriveLineStatus(p, order.order_status),
        returnReason: p.returnReason,
        image: p.image,
        brand: p.brand,
        size: p.size,
        color: p.color,
      });
    });
  }

  return lines;
}

export function countOrdersWaitingPayment(orders: Order[]): number {
  return orders.filter((o) => o.order_status === ORDER_STATUS.WAITING_PAYMENT).length;
}
