const YOOKASSA_API = 'https://api.yookassa.ru/v3';

function getYooKassaAuth() {
	const shopId = process.env.YOOKASSA_SHOP_ID;
	const secretKey = process.env.YOOKASSA_SECRET_KEY;
	if (!shopId || !secretKey) {
		throw new Error('YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY must be set');
	}
	return Buffer.from(`${shopId}:${secretKey}`, 'utf8').toString('base64');
}

async function yooFetch(path, { method = 'GET', body, idempotenceKey } = {}) {
	const headers = {
		Authorization: `Basic ${getYooKassaAuth()}`,
		'Content-Type': 'application/json',
	};
	if (idempotenceKey) headers['Idempotence-Key'] = idempotenceKey;
	const res = await fetch(`${YOOKASSA_API}${path}`, {
		method,
		headers,
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});
	const text = await res.text();
	let data = null;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = { description: text };
	}
	return { ok: res.ok, status: res.status, data };
}

export async function getYooKassaPayment(paymentId) {
	const { ok, status, data } = await yooFetch(`/payments/${paymentId}`);
	if (!ok) {
		const err = new Error(data?.description || `YooKassa GET payment ${status}`);
		err.httpStatus = status;
		throw err;
	}
	return data;
}

export async function cancelYooKassaPayment(paymentId, idempotenceKey) {
	let payment;
	try {
		payment = await getYooKassaPayment(paymentId);
	} catch (e) {
		if (e.httpStatus === 404) return { skipped: true, reason: 'not_found' };
		throw e;
	}
	if (payment.status === 'canceled') return { skipped: true, reason: 'already_canceled' };
	if (payment.status === 'succeeded') return { skipped: true, reason: 'already_succeeded' };

	const { ok, status, data } = await yooFetch(`/payments/${paymentId}/cancel`, {
		method: 'POST',
		body: {},
		idempotenceKey,
	});
	if (!ok) {
		throw new Error(data?.description || `Не удалось отменить платёж ЮKassa (${status})`);
	}
	return { canceled: true, payment: data };
}

export async function createYooKassaRefund({ paymentId, amountValue, idempotenceKey, metadata }) {
	const value = Number(Number(amountValue).toFixed(2));
	if (!Number.isFinite(value) || value < 0.01) return { skipped: true };

	const { ok, status, data } = await yooFetch('/refunds', {
		method: 'POST',
		idempotenceKey,
		body: {
			payment_id: paymentId,
			amount: { value: value.toFixed(2), currency: 'RUB' },
			metadata: metadata || {},
		},
	});
	if (!ok) {
		throw new Error(data?.description || data?.message || `Не удалось вернуть оплату в ЮKassa (${status})`);
	}
	if (data?.status === 'canceled') {
		const reason = data?.cancellation_details?.reason || 'canceled';
		throw new Error(`ЮKassa отклонила возврат: ${reason}`);
	}
	return data;
}

/**
 * Возврат денег (оплаченный заказ) или отмена незавершённого платежа (ожидает оплаты).
 * @returns {{ action: string, clearPaymentId?: boolean, refund?: object }}
 */
export async function settleYooKassaOnOrderChange(order, { refundAmount, idempotenceKey, metadata }) {
	const paymentType = order.payment_type || order.paymentType || 'YOOKASSA';
	const status = order.order_status || order.orderStatus;
	const paymentId = order.paymentId;
	if (!paymentId || paymentType === 'ON_DELIVERY') {
		return { action: 'none' };
	}

	if (status === 'WAITING_PAYMENT') {
		await cancelYooKassaPayment(paymentId, `cancel-${idempotenceKey}`);
		return { action: 'cancel_pending', clearPaymentId: true };
	}

	if (status === 'PAID' || status === 'DELIVERED') {
		const refund = await createYooKassaRefund({
			paymentId,
			amountValue: refundAmount,
			idempotenceKey: `refund-${idempotenceKey}`,
			metadata,
		});
		if (refund?.skipped) return { action: 'none' };
		return { action: 'refund', refund };
	}

	return { action: 'none' };
}
