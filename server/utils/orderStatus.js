export const ORDER_STATUS = {
	WAITING_PAYMENT: 'WAITING_PAYMENT',
	PAID: 'PAID',
	CANCELLED: 'CANCELLED',
	DELIVERED: 'DELIVERED',
	REFUSED: 'REFUSED',
};

/** Допустимые переходы статуса заказа (production workflow). */
export const ORDER_STATUS_TRANSITIONS = {
	[ORDER_STATUS.WAITING_PAYMENT]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
	[ORDER_STATUS.PAID]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.REFUSED, ORDER_STATUS.CANCELLED],
	[ORDER_STATUS.DELIVERED]: [],
	[ORDER_STATUS.CANCELLED]: [],
	[ORDER_STATUS.REFUSED]: [],
};

export function canTransitionOrderStatus(fromStatus, toStatus) {
	if (!fromStatus || !toStatus) return false;
	if (fromStatus === toStatus) return true;
	const allowed = ORDER_STATUS_TRANSITIONS[fromStatus];
	return Array.isArray(allowed) && allowed.includes(toStatus);
}

/** Вернуть остатки при отмене, если заказ ещё не был отменён ранее. */
export function shouldRestoreStockOnCancel(fromStatus) {
	return fromStatus === ORDER_STATUS.WAITING_PAYMENT || fromStatus === ORDER_STATUS.PAID;
}

/** Вернуть остатки при переводе в финальный «отказ» или «отменён». */
export function shouldRestoreStockOnStatusChange(toStatus, fromStatus) {
	if (toStatus === ORDER_STATUS.CANCELLED) {
		return shouldRestoreStockOnCancel(fromStatus);
	}
	if (toStatus === ORDER_STATUS.REFUSED) {
		return fromStatus === ORDER_STATUS.PAID;
	}
	return false;
}

export const ORDER_STATUS_LABELS_RU = {
	[ORDER_STATUS.WAITING_PAYMENT]: 'Ожидает оплаты',
	[ORDER_STATUS.PAID]: 'Оплачен',
	[ORDER_STATUS.CANCELLED]: 'Отменён',
	[ORDER_STATUS.DELIVERED]: 'Получен',
	[ORDER_STATUS.REFUSED]: 'Отказ',
};

export function formatOrderStatusTransitionError(fromStatus, toStatus) {
	const from = ORDER_STATUS_LABELS_RU[fromStatus] || fromStatus || 'неизвестно';
	const to = ORDER_STATUS_LABELS_RU[toStatus] || toStatus || 'неизвестно';
	return `Нельзя перевести заказ из «${from}» в «${to}»`;
}
