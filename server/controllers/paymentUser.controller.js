import mongoose from 'mongoose';
import OrderModel from '../models/order.model.js';
import UserModel from '../models/user.model.js';
import { getOrderPayableAmount } from '../utils/orderItemReturn.js';

const DEFAULT_SECURITY = {
	twoFactorEnabled: false,
	notifications: {
		newLogins: true,
		paymentMethodChanges: true,
		suspiciousActivity: true,
	},
};

function mapOrderStatusToTransactionStatus(orderStatus) {
	if (orderStatus === 'PAID' || orderStatus === 'DELIVERED') return 'completed';
	if (orderStatus === 'WAITING_PAYMENT') return 'pending';
	if (orderStatus === 'CANCELLED' || orderStatus === 'REFUSED') return 'failed';
	return 'pending';
}

function buildDescription(order) {
	const products = order.products || [];
	if (products.length === 0) return 'Оплата заказа';
	const first = products[0]?.productTitle || 'Товар';
	if (products.length === 1) return `Оплата: ${first}`;
	return `Оплата: ${first} и ещё ${products.length - 1}`;
}

/**
 * GET /api/payment/transactions — история по заказам пользователя (JWT)
 */
export const getPaymentTransactionsController = async (request, response) => {
	try {
		const userId = request.userId;
		if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid user',
			});
		}

		const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 }).limit(200).lean();

		const transactions = orders.map((order) => {
			const created = order.createdAt ? new Date(order.createdAt) : new Date();
			const dateStr = created.toISOString().split('T')[0];
			const timeStr = created.toTimeString().slice(0, 8);
			return {
				id: String(order._id),
				date: dateStr,
				time: timeStr,
				description: buildDescription(order),
				amount: getOrderPayableAmount(
					order.totalAmount,
					order.refundedAmount,
					order.order_status,
				),
				currency: 'RUB',
				status: mapOrderStatusToTransactionStatus(order.order_status),
				paymentMethod: order.payment_type === 'YOOKASSA' ? 'ЮKassa' : 'При получении',
				orderId: String(order._id),
			};
		});

		return response.status(200).json({
			error: false,
			success: true,
			data: transactions,
		});
	} catch (error) {
		console.error('[paymentUser] GET transactions error:', error);
		return response.status(500).json({
			error: true,
			success: false,
			message: error.message || 'Server error',
		});
	}
};

/**
 * GET /api/payment/security
 */
export const getPaymentSecurityController = async (request, response) => {
	try {
		const userId = request.userId;
		if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid user',
			});
		}

		const user = await UserModel.findById(userId).select('paymentSecuritySettings').lean();
		if (!user) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'User not found',
			});
		}

		const merged = {
			...DEFAULT_SECURITY,
			...(user.paymentSecuritySettings || {}),
			notifications: {
				...DEFAULT_SECURITY.notifications,
				...(user.paymentSecuritySettings?.notifications || {}),
			},
		};

		return response.status(200).json({
			error: false,
			success: true,
			data: merged,
		});
	} catch (error) {
		console.error('[paymentUser] GET security error:', error);
		return response.status(500).json({
			error: true,
			success: false,
			message: error.message || 'Server error',
		});
	}
};

/**
 * PUT /api/payment/security
 */
export const updatePaymentSecurityController = async (request, response) => {
	try {
		const userId = request.userId;
		if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid user',
			});
		}

		const body = request.body || {};

		const user = await UserModel.findById(userId);
		if (!user) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'User not found',
			});
		}

		if (!user.paymentSecuritySettings) {
			user.paymentSecuritySettings = {};
		}
		if (typeof body.twoFactorEnabled === 'boolean') {
			user.paymentSecuritySettings.twoFactorEnabled = body.twoFactorEnabled;
		}
		if (body.notifications && typeof body.notifications === 'object') {
			user.paymentSecuritySettings.notifications = user.paymentSecuritySettings.notifications || {};
			const n = body.notifications;
			if (typeof n.newLogins === 'boolean') {
				user.paymentSecuritySettings.notifications.newLogins = n.newLogins;
			}
			if (typeof n.paymentMethodChanges === 'boolean') {
				user.paymentSecuritySettings.notifications.paymentMethodChanges = n.paymentMethodChanges;
			}
			if (typeof n.suspiciousActivity === 'boolean') {
				user.paymentSecuritySettings.notifications.suspiciousActivity = n.suspiciousActivity;
			}
		}

		await user.save();

		const merged = {
			...DEFAULT_SECURITY,
			...(user.paymentSecuritySettings || {}),
			notifications: {
				...DEFAULT_SECURITY.notifications,
				...(user.paymentSecuritySettings?.notifications || {}),
			},
		};

		return response.status(200).json({
			error: false,
			success: true,
			data: merged,
		});
	} catch (error) {
		console.error('[paymentUser] PUT security error:', error);
		return response.status(500).json({
			error: true,
			success: false,
			message: error.message || 'Server error',
		});
	}
};
