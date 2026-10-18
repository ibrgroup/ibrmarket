/**
 * Типы для сущности Order (заказ)
 * Синхронизировано с server/models/order.model.js
 *
 * ❗ ВАЖНО:
 * - order_status — единственный источник правды о статусе
 * - payment_status НЕ используется (удалён из модели)
 * - totalAmount — основное поле, total — виртуальное (для совместимости)
 * - products[] — snapshot данных на момент покупки
 */

/**
 * Статусы заказа (enum из бэкенда)
 */
export const ORDER_STATUS = {
  WAITING_PAYMENT: 'WAITING_PAYMENT',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  DELIVERED: 'DELIVERED',
  REFUSED: 'REFUSED',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/** Способ оплаты заказа (синхронно с server/models/order.model.js) */
export type OrderPaymentType = 'YOOKASSA' | 'ON_DELIVERY';

/** Способ получения заказа (синхронно с server/models/order.model.js) */
export type OrderDeliveryMethod = 'courier' | 'pickup';

export function formatOrderDeliveryMethod(dm?: OrderDeliveryMethod | string | null): string {
  if (dm === 'pickup') return 'Самовывоз';
  return 'Доставка курьером';
}

export function formatOrderPaymentType(pt?: OrderPaymentType | string | null): string {
  if (pt === 'ON_DELIVERY') return 'При получении';
  if (pt === 'YOOKASSA' || pt == null || pt === '') return 'ЮKassa';
  return String(pt);
}

/** Подпись клиента в списке заказов (populate или сырой userId) */
export function getOrderCustomerLabel(userId: Order['userId']): string {
  if (userId && typeof userId === 'object') {
    const n = userId.name?.trim();
    const e = userId.email?.trim();
    const m = userId.mobile?.trim();
    return n || e || m || '—';
  }
  if (typeof userId === 'string' && userId.length > 0) {
    return userId.length > 12 ? `…${userId.slice(-8)}` : userId;
  }
  return '—';
}

/** Короткий номер заказа для UI (последние 8 символов id). */
export function formatOrderNumber(id: string | null | undefined): string {
  const s = String(id || '').trim();
  if (!s) return '—';
  return s.slice(-8).toUpperCase();
}

/** Остаток к оплате / к выдаче после отказов и возвратов. Отменённый и отказной заказ — 0. */
export function getOrderPayableAmount(order: {
  totalAmount?: number | null;
  total?: number | null;
  refundedAmount?: number | null;
  order_status?: string | null;
}): number {
  const st = String(order.order_status || '').toUpperCase();
  if (st === ORDER_STATUS.CANCELLED || st === ORDER_STATUS.REFUSED) return 0;
  const total = Number(order.totalAmount ?? order.total ?? 0) || 0;
  const refunded = Number(order.refundedAmount ?? 0) || 0;
  return Math.round(Math.max(0, total - refunded) * 100) / 100;
}

/**
 * Товар в заказе (snapshot на момент покупки)
 * Все данные фиксируются при создании заказа
 */
export interface OrderProduct {
  productId: string;
  productTitle: string;
  quantity: number;
  price: number;
  image?: string;
  subTotal: number;
  /** Сколько единиц возвращено/отменено по позиции */
  returnedQuantity?: number;
  /** RETURNED | REFUSED | CANCELLED */
  returnReason?: string;
  /** Сумма возврата по позиции */
  refundAmount?: number;
  /** _id строки заказа (Mongo subdoc / Prisma item id) */
  _id?: string;
  // Snapshot-данные (фиксируются при создании заказа)
  brand?: string;
  size?: string;
  color?: string;
  ram?: string;
  weight?: string;
  discount?: number;
}

/**
 * Адрес доставки (ref из address collection)
 */
export interface DeliveryAddress {
  _id: string;
  address?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  pincode?: string;
  country?: string;
  phone?: string;
  mobile?: string;
  landmark?: string;
  addressType?: string;
  /** ФИО получателя (Nest Address.name) */
  name?: string;
  locality?: string;
  [key: string]: unknown;
}

/** Пользователь в заказе, когда API подставляет populate */
export type OrderUserSnapshot = {
  _id: string;
  name?: string;
  email?: string | null;
  mobile?: string | null;
  role?: string;
};

/**
 * Заказ
 */
export interface Order {
  _id: string;
  userId: string | OrderUserSnapshot;
  products: OrderProduct[];
  order_status: OrderStatus;
  delivery_address: DeliveryAddress | string; // Может быть объектом или ID
  totalAmount: number; // Основное поле суммы
  /** Накопленная сумма возвратов по заказу */
  refundedAmount?: number;
  total?: number; // Виртуальное поле (= totalAmount) для совместимости
  reservedAt: string | null; // Дата резервирования (ISO string)
  paymentId?: string; // ID платежа YooKassa (устанавливается после оплаты)
  payment_type?: OrderPaymentType; // по умолчанию на бэкенде YOOKASSA
  delivery_method?: OrderDeliveryMethod;
  createdAt: string;
  updatedAt: string;
}

/**
 * Запрос на создание заказа
 * ❗ По умолчанию в заказ попадает вся корзина. Если передать cartItemIds — только эти строки (как на checkout / «Купить сейчас»).
 */
export interface CreateOrderRequest {
  delivery_address: string; // ID адреса доставки
  /** ON_DELIVERY — без онлайн-оплаты, заказ сразу в работе */
  payment_type?: OrderPaymentType;
  /** Курьер или самовывоз (как на checkout) */
  delivery_method?: OrderDeliveryMethod;
  /** ID позиций корзины (Mongo ObjectId), включаемых в заказ; из корзины удаляются только они */
  cartItemIds?: string[];
}

/**
 * Ответ при создании заказа
 */
export interface CreateOrderResponse {
  success: boolean;
  error: boolean;
  message: string;
  order: Order;
}

/**
 * Ошибка при создании заказа (нехватка товара)
 */
export interface CreateOrderError {
  success: false;
  error: true;
  message: string; // Например: 'Not enough stock for "Product Name". Available: 5, requested: 10'
}

/**
 * Запрос на инициализацию платежа YooKassa
 */
export interface InitPaymentRequest {
  orderId: string;
  return_url?: string; // URL возврата после оплаты
  /** Попросить ЮKassa сохранить карту для повторных платежей */
  save_payment_method?: boolean;
}

/**
 * Ответ при инициализации платежа
 */
export interface InitPaymentResponse {
  success: boolean;
  error?: boolean;
  /** Редирект на страницу оплаты / 3-D Secure */
  confirmation_url?: string;
  payment_id?: string;
  /** Оплата сохранённой картой прошла без редиректа */
  paid?: boolean;
  status?: string;
}

/** Оплата заказа сохранённым способом ЮKassa */
export interface PayWithSavedRequest {
  orderId: string;
  /** YooKassa payment_method.id из сохранённых карт пользователя */
  paymentMethodId: string;
  return_url?: string;
}

/**
 * Хелпер: проверка статуса заказа
 */
export function isOrderPaid(order: Order): boolean {
  return order.order_status === ORDER_STATUS.PAID;
}

export function isOrderWaitingPayment(order: Order): boolean {
  return order.order_status === ORDER_STATUS.WAITING_PAYMENT;
}

export function isOrderCancelled(order: Order): boolean {
  return order.order_status === ORDER_STATUS.CANCELLED;
}

export function isOrderDelivered(order: Order): boolean {
  return order.order_status === ORDER_STATUS.DELIVERED;
}

export function isOrderPayOnDelivery(order: Order): boolean {
  return order.payment_type === 'ON_DELIVERY';
}

/**
 * Хелпер: проверка истёк ли резерв (30 минут)
 */
export function isReservationExpired(order: Order, minutesLimit = 30): boolean {
  if (!order.reservedAt) return false;
  const reservedAt = new Date(order.reservedAt);
  const now = new Date();
  const diffMs = now.getTime() - reservedAt.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes > minutesLimit;
}

export function isOrderRefused(order: Order): boolean {
  return order.order_status === ORDER_STATUS.REFUSED;
}

/**
 * Хелпер: получить цвет статуса для UI
 */
export function getOrderStatusColor(
  status: OrderStatus,
): 'yellow' | 'green' | 'red' | 'blue' | 'orange' {
  switch (status) {
    case ORDER_STATUS.WAITING_PAYMENT:
      return 'yellow';
    case ORDER_STATUS.PAID:
      return 'green';
    case ORDER_STATUS.CANCELLED:
      return 'red';
    case ORDER_STATUS.DELIVERED:
      return 'blue';
    case ORDER_STATUS.REFUSED:
      return 'orange';
    default:
      return 'yellow';
  }
}

/**
 * Хелпер: получить текст статуса для UI
 */
export function getOrderStatusText(
  status: OrderStatus,
  paymentType?: OrderPaymentType | string,
): string {
  if (status === ORDER_STATUS.PAID && paymentType === 'ON_DELIVERY') {
    return 'К оплате при получении';
  }
  switch (status) {
    case ORDER_STATUS.WAITING_PAYMENT:
      return 'Ожидает оплаты';
    case ORDER_STATUS.PAID:
      return 'Оплачен';
    case ORDER_STATUS.CANCELLED:
      return 'Отменён';
    case ORDER_STATUS.DELIVERED:
      return 'Получен';
    case ORDER_STATUS.REFUSED:
      return 'Отказ';
    default:
      return 'Неизвестно';
  }
}
