import { ORDER_STATUS } from './orderStatus.js';

/** Причины частичного возврата / отказа по позиции (как на маркетплейсах). */
export const ORDER_ITEM_RETURN_REASON = {
	RETURNED: 'RETURNED',
	REFUSED: 'REFUSED',
	CANCELLED: 'CANCELLED',
};

export const ORDER_ITEM_LINE_STATUS = {
	ACTIVE: 'ACTIVE',
	PARTIAL: 'PARTIAL',
	RETURNED: 'RETURNED',
	REFUSED: 'REFUSED',
	CANCELLED: 'CANCELLED',
};

const RETURN_REASONS = Object.values(ORDER_ITEM_RETURN_REASON);

/** Заказы, в которых можно оформить частичный возврат / отмену позиции. */
export function canPartialReturnOrder(orderStatus) {
	return (
		orderStatus === ORDER_STATUS.WAITING_PAYMENT ||
		orderStatus === ORDER_STATUS.PAID ||
		orderStatus === ORDER_STATUS.DELIVERED
	);
}

export function normalizeReturnReason(reason) {
	const r = String(reason || '')
		.trim()
		.toUpperCase();
	return RETURN_REASONS.includes(r) ? r : null;
}

export function getActiveQuantity(line) {
	const qty = Math.max(0, Number(line?.quantity) || 0);
	const returned = Math.max(0, Number(line?.returnedQuantity) || 0);
	return Math.max(0, qty - returned);
}

export function deriveLineStatus(line) {
	const qty = Math.max(0, Number(line?.quantity) || 0);
	const returned = Math.max(0, Number(line?.returnedQuantity) || 0);
	if (returned <= 0) return ORDER_ITEM_LINE_STATUS.ACTIVE;
	if (returned >= qty) {
		const reason = String(line?.returnReason || '').toUpperCase();
		if (reason === ORDER_ITEM_RETURN_REASON.REFUSED) return ORDER_ITEM_LINE_STATUS.REFUSED;
		if (reason === ORDER_ITEM_RETURN_REASON.CANCELLED) return ORDER_ITEM_LINE_STATUS.CANCELLED;
		return ORDER_ITEM_LINE_STATUS.RETURNED;
	}
	return ORDER_ITEM_LINE_STATUS.PARTIAL;
}

export function computeLineRefundAmount(price, quantity) {
	const unit = Math.max(0, Number(price) || 0);
	const qty = Math.max(0, Number(quantity) || 0);
	return Math.round(unit * qty * 100) / 100;
}

export function sumOrderRefundedAmount(products) {
	return (products || []).reduce((sum, line) => sum + (Number(line?.refundAmount) || 0), 0);
}

/** Если все позиции полностью возвращены — переводим заказ в REFUSED/CANCELLED. */
export function deriveOrderStatusAfterPartialReturn(orderStatus, products) {
	const lines = products || [];
	if (!lines.length) return orderStatus;
	const allFullyReturned = lines.every((line) => getActiveQuantity(line) === 0);
	if (!allFullyReturned) {
		if (orderStatus === ORDER_STATUS.DELIVERED) return ORDER_STATUS.DELIVERED;
		if (orderStatus === ORDER_STATUS.WAITING_PAYMENT) return ORDER_STATUS.WAITING_PAYMENT;
		return ORDER_STATUS.PAID;
	}
	if (orderStatus === ORDER_STATUS.WAITING_PAYMENT) return ORDER_STATUS.CANCELLED;
	const hasRefused = lines.some(
		(line) =>
			getActiveQuantity(line) === 0 &&
			String(line?.returnReason || '').toUpperCase() === ORDER_ITEM_RETURN_REASON.REFUSED,
	);
	return hasRefused ? ORDER_STATUS.REFUSED : ORDER_STATUS.CANCELLED;
}

export function shouldRestoreStockOnPartialReturn(orderStatus) {
	return (
		orderStatus === ORDER_STATUS.WAITING_PAYMENT ||
		orderStatus === ORDER_STATUS.PAID ||
		orderStatus === ORDER_STATUS.DELIVERED
	);
}

/** Сколько ещё должны клиенту / сколько осталось к оплате. */
export function getOrderPayableAmount(totalAmount, refundedAmount, orderStatus) {
	const st = String(orderStatus || '').toUpperCase();
	if (st === ORDER_STATUS.CANCELLED || st === ORDER_STATUS.REFUSED) return 0;
	const total = Number(totalAmount) || 0;
	const refunded = Number(refundedAmount) || 0;
	return Math.round(Math.max(0, total - refunded) * 100) / 100;
}

function lineUnitPrice(line) {
	const qty = Math.max(0, Number(line?.quantity) || 0);
	const sub = Number(line?.subTotal);
	if (qty > 0 && Number.isFinite(sub) && sub > 0) return sub / qty;
	return Math.max(0, Number(line?.price) || 0);
}

/**
 * Закрывает оставшиеся единицы по всем позициям (отмена / отказ заказа целиком).
 */
export function closeRemainingOrderLines(products, reason) {
	const r = normalizeReturnReason(reason) || ORDER_ITEM_RETURN_REASON.CANCELLED;
	for (const line of products || []) {
		const active = getActiveQuantity(line);
		if (active <= 0) {
			if (!line.returnReason) line.returnReason = r;
			continue;
		}
		const delta = computeLineRefundAmount(lineUnitPrice(line), active);
		line.returnedQuantity = Math.max(0, Number(line.quantity) || 0);
		line.returnReason = r;
		line.refundAmount = Math.round((Number(line.refundAmount || 0) + delta) * 100) / 100;
	}
}

/** Сколько единиц ещё «висит» на складе по строке (не возвращать уже возвращённое). */
export function getRestorableQuantity(line) {
	return getActiveQuantity(line);
}
