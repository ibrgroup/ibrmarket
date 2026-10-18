// Types
export * from './model/types';

// Order status workflow
export {
  ORDER_STATUS_TRANSITIONS,
  canTransitionOrderStatus,
  getSelectableOrderStatuses,
  isTerminalOrderStatus,
} from './lib/order-status-transitions';

export { OrderStatusBadge } from './ui/OrderStatusBadge';
export { OrderLineStatusBadge } from './ui/OrderLineStatusBadge';
export { OrderLineSpecs } from './ui/OrderLineSpecs';
export { formatOrderLineSpecsPlain, getOrderLineSpecRows } from './lib/order-line-specs';

export {
  ORDER_ITEM_LINE_STATUS,
  ORDER_ITEM_RETURN_REASON,
  canPartialReturnOrderStatus,
  deriveLineStatus,
  getActiveLineQuantity,
  getLineStatusLabel,
  getOrderLineId,
  getRemainingLineAmount,
  getReturnReasonLabel,
  hasOrderLineAdjustments,
  type OrderItemLineStatus,
  type OrderItemReturnReason,
} from './lib/order-line-return';

// Purchase history helpers
export {
  countOrdersWaitingPayment,
  ordersToPurchaseLines,
  type PurchaseLine,
} from './lib/purchase-lines';

// Hooks
export { useCreateOrder } from './lib/use-create-order';
export { useInitPayment, usePayWithSavedCard } from './lib/use-init-payment';
export { useOrder } from './lib/use-order';
export { useOrders } from './lib/use-orders';
