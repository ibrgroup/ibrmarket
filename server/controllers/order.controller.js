import mongoose from 'mongoose';
import sendEmailFun from '../config/sendEmail.js';
import CartModel from '../models/cart.model.js';
import OrderModel from '../models/order.model.js';
import ProductModel from '../models/product.model.js';
import UserModel from '../models/user.model.js';
import { appendAdminAudit } from '../utils/adminAudit.js';
import OrderConfirmationEmail from '../utils/orderEmailTemplate.js';
import { PERM, can } from '../utils/permissions.js';
import {
	applyOrderStockDecrement,
	applyOrderStockIncrement,
	getAvailableStockForLine,
} from '../utils/variantStock.js';
import {
	ORDER_STATUS,
	canTransitionOrderStatus,
	shouldRestoreStockOnStatusChange,
	formatOrderStatusTransitionError,
} from '../utils/orderStatus.js';
import {
	canPartialReturnOrder,
	computeLineRefundAmount,
	deriveOrderStatusAfterPartialReturn,
	getActiveQuantity,
	getOrderPayableAmount,
	getRestorableQuantity,
	normalizeReturnReason,
	shouldRestoreStockOnPartialReturn,
	sumOrderRefundedAmount,
	closeRemainingOrderLines,
} from '../utils/orderItemReturn.js';
import { cancelYooKassaPayment, settleYooKassaOnOrderChange } from '../utils/yookassaApi.js';

/**
 * POST /api/order/create
 * 1. Получаем cartItems
 * 2. Для каждой строки проверяем остаток (variantStock при совпадении иначе countInStock)
 * 3. Создаём Order WAITING_PAYMENT, reservedAt = now
 * 4. Списываем остатки (слот variantStock + countInStock или только countInStock)
 * 5. Удаляем из корзины только позиции, вошедшие в заказ (или всю корзину, если cartItemIds не переданы)
 */
export const createOrderController = async (request, response) => {
	try {
		const userId = request.userId;
		const {
			delivery_address: deliveryAddress,
			payment_type: paymentTypeRaw,
			delivery_method: deliveryMethodRaw,
			cartItemIds: cartItemIdsRaw,
		} = request.body;
		const paymentType = paymentTypeRaw === 'ON_DELIVERY' ? 'ON_DELIVERY' : 'YOOKASSA';
		const deliveryMethod =
			deliveryMethodRaw === 'pickup' || deliveryMethodRaw === 'PICKUP' ? 'pickup' : 'courier';

		if (!deliveryAddress) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'delivery_address is required',
			});
		}

		const allCartItems = await CartModel.find({ userId });
		if (!allCartItems?.length) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Cart is empty',
			});
		}

		const cartItemIds = Array.isArray(cartItemIdsRaw)
			? [...new Set(cartItemIdsRaw.map((id) => String(id)).filter(Boolean))]
			: [];

		let cartItems = allCartItems;
		if (cartItemIds.length > 0) {
			const idSet = new Set(cartItemIds);
			cartItems = allCartItems.filter((c) => idSet.has(String(c._id)));
			const missing = cartItemIds.filter((id) => !allCartItems.some((c) => String(c._id) === id));
			if (missing.length > 0 || cartItems.length === 0) {
				return response.status(400).json({
					error: true,
					success: false,
					message: 'Часть позиций не найдена в корзине. Обновите корзину и попробуйте снова.',
				});
			}
		}

		const adjustedMessages = [];
		for (const item of cartItems) {
			const product = await ProductModel.findById(item.productId);
			const stock = getAvailableStockForLine(product, item);
			if (stock < item.quantity) {
				const newQty = Math.max(0, stock);
				if (newQty === 0) {
					await CartModel.deleteOne({ _id: item._id });
					adjustedMessages.push(`"${item.productTitle}": нет в наличии (удалено из корзины)`);
				} else {
					const newSubTotal = (item.price || 0) * newQty;
					await CartModel.updateOne({ _id: item._id }, { quantity: newQty, subTotal: newSubTotal });
					adjustedMessages.push(
						`"${item.productTitle}": доступно ${stock}, в корзине было ${item.quantity} — количество обновлено до ${newQty}`,
					);
				}
			}
		}

		if (adjustedMessages.length > 0) {
			const refreshed = await CartModel.find({ userId });
			if (cartItemIds.length > 0) {
				const idSet = new Set(cartItemIds);
				cartItems = refreshed.filter((c) => idSet.has(String(c._id)));
			} else {
				cartItems = refreshed;
			}
			if (!cartItems?.length) {
				return response.status(400).json({
					error: true,
					success: false,
					message:
						'Недостаточно остатков по части товаров. Корзина обновлена. Корзина пуста — добавьте товары снова.',
				});
			}
			return response.status(400).json({
				error: true,
				success: false,
				message: `Недостаточно остатков. ${adjustedMessages.join(' ')} Проверьте корзину и оформите заказ снова.`,
				code: 'INSUFFICIENT_STOCK',
			});
		}

		const products = cartItems.map((item) => ({
			productId: item.productId,
			productTitle: item.productTitle,
			quantity: item.quantity,
			price: item.price,
			image: item.image,
			subTotal: item.subTotal,
			brand: item.brand,
			size: item.size,
			color: item.color,
			ram: item.ram,
			weight: item.weight,
			discount: item.discount ?? 0,
		}));

		const totalAmount = products.reduce((sum, p) => sum + (p.subTotal || p.price * p.quantity), 0);

		const order = new OrderModel({
			userId,
			products,
			delivery_address: deliveryAddress,
			delivery_method: deliveryMethod,
			totalAmount,
			order_status:
				paymentType === 'ON_DELIVERY' ? ORDER_STATUS.PAID : ORDER_STATUS.WAITING_PAYMENT,
			payment_type: paymentType,
			paymentId: '',
			reservedAt: new Date(),
		});

		await order.save();

		for (const item of cartItems) {
			await applyOrderStockDecrement(ProductModel, item.productId, item.quantity, item);
		}

		const orderedIds = cartItems.map((c) => c._id);
		await CartModel.deleteMany({ _id: { $in: orderedIds }, userId });

		return response.status(201).json({
			error: false,
			success: true,
			message: 'Order created',
			order,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
};

export async function getOrderDetailsController(request, response) {
	try {
		const page = Math.max(1, parseInt(request.query.page) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(request.query.limit) || 20));

		const [orderlist, total] = await Promise.all([
			OrderModel.find()
				.sort({ createdAt: -1 })
				.populate('delivery_address')
				.populate({ path: 'userId', select: 'name email mobile role' })
				.skip((page - 1) * limit)
				.limit(limit)
				.lean(),
			OrderModel.countDocuments(),
		]);

		return response.json({
			message: 'order list',
			data: orderlist,
			error: false,
			success: true,
			total,
			page,
			totalPages: Math.ceil(total / limit) || 1,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function getUserOrderDetailsController(request, response) {
	try {
		const userId = request.userId;
		const page = Math.max(1, parseInt(request.query.page) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(request.query.limit) || 20));

		const [orderlist, total] = await Promise.all([
			OrderModel.find({ userId })
				.sort({ createdAt: -1 })
				.populate('delivery_address')
				.skip((page - 1) * limit)
				.limit(limit)
				.lean(),
			OrderModel.countDocuments({ userId }),
		]);

		return response.json({
			message: 'order list',
			data: orderlist,
			orders: orderlist,
			error: false,
			success: true,
			total,
			page,
			totalPages: Math.ceil(total / limit) || 1,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

/**
 * GET /api/order/:id
 * Получить один заказ по ID. Только свой заказ (userId).
 */
export async function getOrderByIdController(request, response) {
	try {
		const userId = request.userId;
		const orderId = request.params.id;
		const canViewAllOrders = can(request.userRole, PERM.ORDERS);

		if (!orderId) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Order id is required',
			});
		}

		if (!mongoose.isValidObjectId(orderId)) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid order id',
			});
		}

		const query = canViewAllOrders ? { _id: orderId } : { _id: orderId, userId };
		const order = await OrderModel.findOne(query)
			.populate('delivery_address')
			.populate({ path: 'userId', select: 'name email mobile role' })
			.lean();

		if (!order) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'Order not found',
			});
		}

		return response.json({
			error: false,
			success: true,
			order,
			data: order,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function getTotalOrdersCountController(request, response) {
	try {
		const ordersCount = await OrderModel.countDocuments();
		return response.status(200).json({
			error: false,
			success: true,
			count: ordersCount,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export const updateOrderStatusController = async (request, response) => {
	try {
		const orderId = request.params.id || request.body.id;
		const { order_status: orderStatus } = request.body;

		if (!orderId) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Order id is required',
			});
		}

		if (!mongoose.isValidObjectId(orderId)) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid order id',
			});
		}

		const allowedStatuses = Object.values(ORDER_STATUS);
		if (!orderStatus || !allowedStatuses.includes(orderStatus)) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid order_status',
			});
		}

		const order = await OrderModel.findById(orderId);
		if (!order) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'Order not found',
			});
		}

		const currentStatus = order.order_status;
		if (currentStatus === orderStatus) {
			return response.json({
				message: 'Статус без изменений',
				success: true,
				error: false,
				data: { order_status: currentStatus },
			});
		}

		if (!canTransitionOrderStatus(currentStatus, orderStatus)) {
			return response.status(400).json({
				error: true,
				success: false,
				message: formatOrderStatusTransitionError(currentStatus, orderStatus),
			});
		}

		if (shouldRestoreStockOnStatusChange(orderStatus, currentStatus)) {
			for (const item of order.products || []) {
				const qty = getRestorableQuantity(item);
				if (qty > 0) {
					await applyOrderStockIncrement(ProductModel, item.productId, qty, item);
				}
			}
		}

		if (
			(orderStatus === ORDER_STATUS.CANCELLED || orderStatus === ORDER_STATUS.REFUSED) &&
			(currentStatus === ORDER_STATUS.WAITING_PAYMENT || currentStatus === ORDER_STATUS.PAID)
		) {
			try {
				const remaining = getOrderPayableAmount(
					order.totalAmount,
					order.refundedAmount,
					currentStatus,
				);
				const money = await settleYooKassaOnOrderChange(order, {
					refundAmount: remaining,
					idempotenceKey: `status-${orderId}-${currentStatus}-${orderStatus}`,
					metadata: { orderId: String(orderId), kind: 'status' },
				});
				if (money.clearPaymentId) order.paymentId = '';
			} catch (e) {
				return response.status(502).json({
					error: true,
					success: false,
					message: e.message || 'Не удалось провести возврат в ЮKassa',
				});
			}
			closeRemainingOrderLines(
				order.products,
				orderStatus === ORDER_STATUS.REFUSED
					? 'REFUSED'
					: 'CANCELLED',
			);
			order.markModified('products');
			order.refundedAmount = sumOrderRefundedAmount(order.products);
		}

		order.order_status = orderStatus;
		await order.save();

		await appendAdminAudit(request.userId, 'order.status_update', {
			entityType: 'order',
			entityId: orderId,
			metadata: { from: currentStatus, order_status: orderStatus },
		});

		return response.json({
			message: 'Update order status',
			success: true,
			error: false,
			data: { order_status: order.order_status },
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
};

/** PATCH /api/admin/orders/:id/items/:itemId/return — частичный возврат/отказ по позиции */
export const partialReturnOrderItemController = async (request, response) => {
	try {
		const orderId = request.params.id;
		const itemId = request.params.itemId;
		const quantityRaw = request.body?.quantity;
		const reason = normalizeReturnReason(request.body?.reason);

		if (!mongoose.isValidObjectId(orderId) || !mongoose.isValidObjectId(itemId)) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid order or item id',
			});
		}

		const returnQty = Math.max(1, parseInt(quantityRaw, 10) || 0);
		if (!reason) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid reason. Use RETURNED, REFUSED or CANCELLED',
			});
		}

		const order = await OrderModel.findById(orderId);
		if (!order) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'Order not found',
			});
		}

		if (!canPartialReturnOrder(order.order_status)) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Возврат или отмена позиции недоступны для этого статуса заказа',
			});
		}

		const line = order.products.id(itemId);
		if (!line) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'Order item not found',
			});
		}

		const activeQty = getActiveQuantity(line);
		if (returnQty > activeQty) {
			return response.status(400).json({
				error: true,
				success: false,
				message: `Можно вернуть не более ${activeQty} шт.`,
			});
		}

		const unitPrice =
			line.quantity > 0
				? (line.subTotal || line.price * line.quantity) / line.quantity
				: line.price;
		const refundDelta = computeLineRefundAmount(unitPrice, returnQty);
		const nextReturned = (line.returnedQuantity || 0) + returnQty;

		try {
			const money = await settleYooKassaOnOrderChange(order, {
				refundAmount: refundDelta,
				idempotenceKey: `item-${orderId}-${itemId}-${nextReturned}`,
				metadata: { orderId: String(orderId), itemId: String(itemId), kind: 'item_return' },
			});
			if (money.clearPaymentId) order.paymentId = '';
		} catch (e) {
			return response.status(502).json({
				error: true,
				success: false,
				message: e.message || 'Не удалось провести возврат в ЮKassa',
			});
		}

		line.returnedQuantity = nextReturned;
		line.returnReason = reason;
		line.refundAmount = Math.round(((line.refundAmount || 0) + refundDelta) * 100) / 100;

		if (shouldRestoreStockOnPartialReturn(order.order_status)) {
			await applyOrderStockIncrement(ProductModel, line.productId, returnQty, line);
		}

		order.refundedAmount = sumOrderRefundedAmount(order.products);
		order.order_status = deriveOrderStatusAfterPartialReturn(order.order_status, order.products);
		order.markModified('products');
		await order.save();

		await appendAdminAudit(request.userId, 'order.item_return', {
			entityType: 'order',
			entityId: orderId,
			metadata: {
				itemId,
				quantity: returnQty,
				reason,
				refundDelta,
				refundedAmount: order.refundedAmount,
			},
		});

		return response.json({
			success: true,
			error: false,
			message: 'Item return processed',
			data: {
				order,
				item: line,
				refundDelta,
			},
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
};

export const totalSalesController = async (request, response) => {
	try {
		const currentYear = new Date().getFullYear();

		const ordersList = await OrderModel.find();

		let totalSales = 0;
		const monthlySales = [
			{
				name: 'JAN',
				TotalSales: 0,
			},
			{
				name: 'FEB',
				TotalSales: 0,
			},
			{
				name: 'MAR',
				TotalSales: 0,
			},
			{
				name: 'APRIL',
				TotalSales: 0,
			},
			{
				name: 'MAY',
				TotalSales: 0,
			},
			{
				name: 'JUNE',
				TotalSales: 0,
			},
			{
				name: 'JULY',
				TotalSales: 0,
			},
			{
				name: 'AUG',
				TotalSales: 0,
			},
			{
				name: 'SEP',
				TotalSales: 0,
			},
			{
				name: 'OCT',
				TotalSales: 0,
			},
			{
				name: 'NOV',
				TotalSales: 0,
			},
			{
				name: 'DEC',
				TotalSales: 0,
			},
		];

		for (let i = 0; i < ordersList.length; i++) {
			const amt = getOrderPayableAmount(
				ordersList[i].totalAmount,
				ordersList[i].refundedAmount,
				ordersList[i].order_status,
			);
			totalSales = totalSales + amt;
			const str = JSON.stringify(ordersList[i]?.createdAt);
			const year = str.substr(1, 4);
			const monthStr = str.substr(6, 8);
			const month = parseInt(monthStr.substr(0, 2));

			if (currentYear == year) {
				if (month === 1) {
					monthlySales[0] = {
						name: 'JAN',
						TotalSales: (monthlySales[0].TotalSales =
							parseInt(monthlySales[0].TotalSales) + amt),
					};
				}

				if (month === 2) {
					monthlySales[1] = {
						name: 'FEB',
						TotalSales: (monthlySales[1].TotalSales =
							parseInt(monthlySales[1].TotalSales) + amt),
					};
				}

				if (month === 3) {
					monthlySales[2] = {
						name: 'MAR',
						TotalSales: (monthlySales[2].TotalSales =
							parseInt(monthlySales[2].TotalSales) + amt),
					};
				}

				if (month === 4) {
					monthlySales[3] = {
						name: 'APRIL',
						TotalSales: (monthlySales[3].TotalSales =
							parseInt(monthlySales[3].TotalSales) + amt),
					};
				}

				if (month === 5) {
					monthlySales[4] = {
						name: 'MAY',
						TotalSales: (monthlySales[4].TotalSales =
							parseInt(monthlySales[4].TotalSales) + amt),
					};
				}

				if (month === 6) {
					monthlySales[5] = {
						name: 'JUNE',
						TotalSales: (monthlySales[5].TotalSales =
							parseInt(monthlySales[5].TotalSales) + amt),
					};
				}

				if (month === 7) {
					monthlySales[6] = {
						name: 'JULY',
						TotalSales: (monthlySales[6].TotalSales =
							parseInt(monthlySales[6].TotalSales) + amt),
					};
				}

				if (month === 8) {
					monthlySales[7] = {
						name: 'AUG',
						TotalSales: (monthlySales[7].TotalSales =
							parseInt(monthlySales[7].TotalSales) + amt),
					};
				}

				if (month === 9) {
					monthlySales[8] = {
						name: 'SEP',
						TotalSales: (monthlySales[8].TotalSales =
							parseInt(monthlySales[8].TotalSales) + amt),
					};
				}

				if (month === 10) {
					monthlySales[9] = {
						name: 'OCT',
						TotalSales: (monthlySales[9].TotalSales =
							parseInt(monthlySales[9].TotalSales) + amt),
					};
				}

				if (month === 11) {
					monthlySales[10] = {
						name: 'NOV',
						TotalSales: (monthlySales[10].TotalSales =
							parseInt(monthlySales[10].TotalSales) + amt),
					};
				}

				if (month === 12) {
					monthlySales[11] = {
						name: 'DEC',
						TotalSales: (monthlySales[11].TotalSales =
							parseInt(monthlySales[11].TotalSales) + amt),
					};
				}
			}
		}

		return response.status(200).json({
			totalSales: totalSales,
			monthlySales: monthlySales,
			error: false,
			success: true,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
};

export const totalUsersController = async (request, response) => {
	try {
		const users = await UserModel.aggregate([
			{
				$group: {
					_id: {
						year: { $year: '$createdAt' },
						month: { $month: '$createdAt' },
					},
					count: { $sum: 1 },
				},
			},
			{
				$sort: { '_id.year': 1, '_id.month': 1 },
			},
		]);

		const monthlyUsers = [
			{
				name: 'JAN',
				TotalUsers: 0,
			},
			{
				name: 'FEB',
				TotalUsers: 0,
			},
			{
				name: 'MAR',
				TotalUsers: 0,
			},
			{
				name: 'APRIL',
				TotalUsers: 0,
			},
			{
				name: 'MAY',
				TotalUsers: 0,
			},
			{
				name: 'JUNE',
				TotalUsers: 0,
			},
			{
				name: 'JULY',
				TotalUsers: 0,
			},
			{
				name: 'AUG',
				TotalUsers: 0,
			},
			{
				name: 'SEP',
				TotalUsers: 0,
			},
			{
				name: 'OCT',
				TotalUsers: 0,
			},
			{
				name: 'NOV',
				TotalUsers: 0,
			},
			{
				name: 'DEC',
				TotalUsers: 0,
			},
		];

		for (let i = 0; i < users.length; i++) {
			if (users[i]?._id?.month === 1) {
				monthlyUsers[0] = {
					name: 'JAN',
					TotalUsers: users[i].count,
				};
			}

			if (users[i]?._id?.month === 2) {
				monthlyUsers[1] = {
					name: 'FEB',
					TotalUsers: users[i].count,
				};
			}

			if (users[i]?._id?.month === 3) {
				monthlyUsers[2] = {
					name: 'MAR',
					TotalUsers: users[i].count,
				};
			}

			if (users[i]?._id?.month === 4) {
				monthlyUsers[3] = {
					name: 'APRIL',
					TotalUsers: users[i].count,
				};
			}

			if (users[i]?._id?.month === 5) {
				monthlyUsers[4] = {
					name: 'MAY',
					TotalUsers: users[i].count,
				};
			}

			if (users[i]?._id?.month === 6) {
				monthlyUsers[5] = {
					name: 'JUNE',
					TotalUsers: users[i].count,
				};
			}

			if (users[i]?._id?.month === 7) {
				monthlyUsers[6] = {
					name: 'JULY',
					TotalUsers: users[i].count,
				};
			}

			if (users[i]?._id?.month === 8) {
				monthlyUsers[7] = {
					name: 'AUG',
					TotalUsers: users[i].count,
				};
			}

			if (users[i]?._id?.month === 9) {
				monthlyUsers[8] = {
					name: 'SEP',
					TotalUsers: users[i].count,
				};
			}

			if (users[i]?._id?.month === 10) {
				monthlyUsers[9] = {
					name: 'OCT',
					TotalUsers: users[i].count,
				};
			}

			if (users[i]?._id?.month === 11) {
				monthlyUsers[10] = {
					name: 'NOV',
					TotalUsers: users[i].count,
				};
			}

			if (users[i]?._id?.month === 12) {
				monthlyUsers[11] = {
					name: 'DEC',
					TotalUsers: users[i].count,
				};
			}
		}

		return response.status(200).json({
			TotalUsers: monthlyUsers,
			error: false,
			success: true,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
};

export async function deleteOrder(request, response) {
	try {
		const id = request.params.id;
		const order = await OrderModel.findById(id);

		if (!order) {
			return response.status(404).json({
				message: 'Order Not found',
				error: true,
				success: false,
			});
		}

		// Вернуть остатки, если заказ ещё ждал оплату (сток уже был списан при создании)
		if (order.order_status === ORDER_STATUS.WAITING_PAYMENT) {
			for (const item of order.products || []) {
				await applyOrderStockIncrement(ProductModel, item.productId, item.quantity || 0, item);
			}
		}

		const deletedOrder = await OrderModel.findByIdAndDelete(id);

		if (!deletedOrder) {
			return response.status(404).json({
				message: 'Order not deleted!',
				success: false,
				error: true,
			});
		}

		await appendAdminAudit(request.userId, 'order.delete', {
			entityType: 'order',
			entityId: id,
		});

		return response.status(200).json({
			success: true,
			error: false,
			message: 'Order Deleted!',
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

const YOOKASSA_API = 'https://api.yookassa.ru/v3';

function getYooKassaAuth() {
	const shopId = process.env.YOOKASSA_SHOP_ID;
	const secretKey = process.env.YOOKASSA_SECRET_KEY;
	if (!shopId || !secretKey) {
		throw new Error('YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY must be set');
	}
	return Buffer.from(`${shopId}:${secretKey}`, 'utf8').toString('base64');
}

function getFrontendBaseUrl() {
	return (
		process.env.FRONTEND_URL ||
		process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ||
		'http://localhost:3000'
	).replace(/\/$/, '');
}

/** Разрешаем только return_url на том же origin, что FRONTEND_URL. */
function resolveSafeReturnUrl(returnUrl, fallbackPath) {
	const baseUrl = getFrontendBaseUrl();
	const fallback = `${baseUrl}${fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`}`;
	if (!returnUrl || typeof returnUrl !== 'string') return fallback;
	try {
		const allowed = new URL(baseUrl);
		const candidate = new URL(returnUrl, baseUrl);
		if (candidate.origin !== allowed.origin) return fallback;
		return candidate.toString();
	} catch {
		return fallback;
	}
}

function paymentAmountMatchesOrder(payment, orderTotal) {
	const paid = Number(payment?.amount?.value);
	const expected = Number(Number(orderTotal).toFixed(2));
	if (!Number.isFinite(paid) || !Number.isFinite(expected)) return false;
	const currency = payment?.amount?.currency || 'RUB';
	return currency === 'RUB' && Math.abs(paid - expected) < 0.009;
}

/** Сохранить карту из объекта платежа ЮKassa (после успешной оплаты с save_payment_method). */
async function upsertSavedPaymentMethodFromYooPayment(userId, payment) {
	try {
		if (!userId || !payment?.payment_method) return;
		const pm = payment.payment_method;
		if (pm.type !== 'bank_card' || !pm.saved) return;
		const card = pm.card;
		if (!card?.last4) return;

		const user = await UserModel.findById(userId);
		if (!user) return;
		if (!user.paymentMethods) user.paymentMethods = [];

		const paymentMethodId = pm.id;
		if (!paymentMethodId) return;

		const lastFour = String(card.last4);
		const brand = String(card.card_type || 'card').toLowerCase();
		const expiryMonth = parseInt(String(card.expiry_month), 10) || 0;
		const expiryYear = parseInt(String(card.expiry_year), 10) || 0;

		const idx = user.paymentMethods.findIndex((m) => m.paymentMethodId === paymentMethodId);
		if (idx >= 0) {
			const doc = user.paymentMethods[idx];
			doc.lastFour = lastFour;
			doc.brand = brand;
			doc.expiryMonth = expiryMonth;
			doc.expiryYear = expiryYear;
		} else {
			const makeDefault = user.paymentMethods.length === 0;
			if (makeDefault) {
				user.paymentMethods.forEach((m) => {
					m.isDefault = false;
				});
			}
			user.paymentMethods.push({
				paymentMethodId,
				type: 'card',
				lastFour,
				brand,
				expiryMonth,
				expiryYear,
				isDefault: makeDefault,
				createdAt: new Date(),
			});
		}
		await user.save();
	} catch (e) {
		console.error('[YooKassa] upsertSavedPaymentMethod error:', e);
	}
}

/**
 * POST /api/order/payment/yookassa/init
 * Инициализация платежа ЮKassa. Возвращает confirmation_url для redirect.
 */
export const createPaymentYooKassaController = async (request, response) => {
	try {
		const userId = request.userId;
		const { orderId, return_url: returnUrl, save_payment_method: savePaymentMethod } = request.body;

		if (!orderId) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'orderId is required',
			});
		}

		const order = await OrderModel.findOne({ _id: orderId, userId });
		if (!order) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'Order not found',
			});
		}

		if (order.order_status !== ORDER_STATUS.WAITING_PAYMENT) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Order is not waiting for payment',
			});
		}

		if (order.payment_type === 'ON_DELIVERY') {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Online payment is not available for pay-on-delivery orders',
			});
		}

		const payable = getOrderPayableAmount(order.totalAmount, order.refundedAmount, order.order_status);
		if (payable < 0.01) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'По заказу нечего оплачивать',
			});
		}

		const backUrl = resolveSafeReturnUrl(returnUrl, '/account/orders');

		const value = String(Number(payable).toFixed(2));
		const payload = {
			amount: { value, currency: 'RUB' },
			confirmation: { type: 'redirect', return_url: backUrl },
			description: `Order #${order._id}`,
			metadata: { orderId: String(order._id), userId: String(order.userId) },
		};

		if (savePaymentMethod === true && order.userId) {
			payload.save_payment_method = true;
			payload.merchant_customer_id = String(order.userId);
		}

		if (order.paymentId) {
			try {
				await cancelYooKassaPayment(order.paymentId, `reinit-cancel-${orderId}-${value}`);
			} catch (e) {
				console.warn('[YooKassa] cancel stale payment before init:', e.message);
			}
		}

		const idempotenceKey = `init-${orderId}-${value}`;
		const auth = getYooKassaAuth();

		const res = await fetch(`${YOOKASSA_API}/payments`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Idempotence-Key': idempotenceKey,
				Authorization: `Basic ${auth}`,
			},
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const errText = await res.text();
			console.error('[YooKassa] create payment error:', res.status, errText);
			return response.status(502).json({
				error: true,
				success: false,
				message: 'Payment provider error',
			});
		}

		const data = await res.json();
		const confirmationUrl = data.confirmation?.confirmation_url;
		if (!confirmationUrl) {
			return response.status(502).json({
				error: true,
				success: false,
				message: 'No confirmation_url in response',
			});
		}

		// Сохраняем paymentId, чтобы страница успеха могла синхронизировать статус с ЮKassa (webhook может не дойти на localhost)
		await OrderModel.updateOne({ _id: orderId, userId }, { paymentId: data.id || '' });

		return response.status(200).json({
			error: false,
			success: true,
			confirmation_url: confirmationUrl,
			payment_id: data.id,
		});
	} catch (error) {
		console.error('[YooKassa] init error:', error);
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
};

/**
 * POST /api/order/payment/yookassa/pay-with-saved
 * Оплата сохранённым payment_method_id (карта должна быть в профиле пользователя).
 */
export const payWithSavedYooKassaController = async (request, response) => {
	try {
		const userId = request.userId;
		const { orderId, paymentMethodId: yooPaymentMethodId, return_url: returnUrl } = request.body;

		if (!orderId || !yooPaymentMethodId) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'orderId and paymentMethodId are required',
			});
		}

		const user = await UserModel.findById(userId).select('paymentMethods email name');
		const hasCard = user?.paymentMethods?.some((m) => m.paymentMethodId === yooPaymentMethodId);
		if (!hasCard) {
			return response.status(403).json({
				error: true,
				success: false,
				message: 'Saved card not found',
			});
		}

		const order = await OrderModel.findOne({ _id: orderId, userId });
		if (!order) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'Order not found',
			});
		}

		if (order.order_status !== ORDER_STATUS.WAITING_PAYMENT) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Order is not waiting for payment',
			});
		}

		if (order.payment_type === 'ON_DELIVERY') {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Online payment is not available for pay-on-delivery orders',
			});
		}

		const backUrl = resolveSafeReturnUrl(
			returnUrl,
			`/checkout/success?orderId=${encodeURIComponent(orderId)}`,
		);

		const payable = getOrderPayableAmount(order.totalAmount, order.refundedAmount, order.order_status);
		if (payable < 0.01) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'По заказу нечего оплачивать',
			});
		}
		const value = String(Number(payable).toFixed(2));
		const payload = {
			amount: { value, currency: 'RUB' },
			payment_method_id: yooPaymentMethodId,
			capture: true,
			confirmation: { type: 'redirect', return_url: backUrl },
			description: `Order #${order._id}`,
			metadata: { orderId: String(order._id), userId: String(userId) },
		};

		const idempotenceKey = `saved-${orderId}-${yooPaymentMethodId}-${value}`;
		const authHeader = getYooKassaAuth();

		const res = await fetch(`${YOOKASSA_API}/payments`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Idempotence-Key': idempotenceKey,
				Authorization: `Basic ${authHeader}`,
			},
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const errText = await res.text();
			console.error('[YooKassa] pay-with-saved error:', res.status, errText);
			return response.status(502).json({
				error: true,
				success: false,
				message: 'Payment provider error',
			});
		}

		const data = await res.json();
		await OrderModel.updateOne({ _id: orderId, userId }, { paymentId: data.id || '' });

		const done = data.status === 'succeeded' || data.status === 'waiting_for_capture';
		if (done) {
			if (!paymentAmountMatchesOrder(data, payable)) {
				console.error('[YooKassa] pay-with-saved amount mismatch', {
					orderId,
					paid: data?.amount?.value,
					expected: payable,
				});
				return response.status(502).json({
					error: true,
					success: false,
					message: 'Payment amount mismatch',
				});
			}
			const paidUpdate = await OrderModel.updateOne(
				{ _id: orderId, userId, order_status: ORDER_STATUS.WAITING_PAYMENT },
				{ order_status: ORDER_STATUS.PAID, paymentId: data.id },
			);
			if (paidUpdate.modifiedCount > 0) {
				await upsertSavedPaymentMethodFromYooPayment(userId, data);
				if (user?.email) {
					const updatedOrder = await OrderModel.findById(orderId);
					await sendEmailFun({
						sendTo: [user.email],
						subject: 'Order Confirmation',
						text: '',
						html: OrderConfirmationEmail(user.name, updatedOrder),
					});
				}
			}
			return response.status(200).json({
				error: false,
				success: true,
				paid: true,
				payment_id: data.id,
			});
		}

		const confirmationUrl = data.confirmation?.confirmation_url;
		if (confirmationUrl) {
			return response.status(200).json({
				error: false,
				success: true,
				confirmation_url: confirmationUrl,
				payment_id: data.id,
				status: data.status,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			paid: false,
			payment_id: data.id,
			status: data.status,
			message: 'Ожидание подтверждения платежа',
		});
	} catch (error) {
		console.error('[YooKassa] pay-with-saved exception:', error);
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
};

/**
 * POST /api/payment/yookassa/webhook
 * Идемпотентность по order_status: если заказ уже PAID → 200.
 * payment.succeeded → order_status = PAID, paymentId; письмо.
 * payment.canceled → order_status = CANCELLED; вернуть Product.countInStock.
 */
export const yookassaWebhookController = async (request, response) => {
	let payload;
	try {
		payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
	} catch {
		return response.status(400).send('Invalid JSON');
	}

	const { type, event, object: paymentObject } = payload;
	if (type !== 'notification' || !event || !paymentObject?.id) {
		return response.status(200).send('OK');
	}

	if (event !== 'payment.succeeded' && event !== 'payment.canceled') {
		return response.status(200).send('OK');
	}

	const orderId = paymentObject.metadata?.orderId;
	if (!orderId) {
		return response.status(200).send('OK');
	}

	const order = await OrderModel.findById(orderId);
	if (!order) {
		return response.status(200).send('OK');
	}

	if (order.payment_type === 'ON_DELIVERY') {
		return response.status(200).send('OK');
	}

	if (order.order_status === ORDER_STATUS.PAID) {
		return response.status(200).send('OK');
	}

	const auth = getYooKassaAuth();
	let verifiedPayment;
	try {
		const res = await fetch(`${YOOKASSA_API}/payments/${paymentObject.id}`, {
			headers: { Authorization: `Basic ${auth}` },
		});
		if (!res.ok) {
			console.error('[YooKassa] webhook verify GET payment failed:', res.status);
			return response.status(200).send('OK');
		}
		verifiedPayment = await res.json();
	} catch (err) {
		console.error('[YooKassa] webhook verify error:', err);
		return response.status(200).send('OK');
	}

	if (verifiedPayment.metadata?.orderId !== orderId) {
		return response.status(200).send('OK');
	}

	if (order.order_status !== ORDER_STATUS.WAITING_PAYMENT) {
		return response.status(200).send('OK');
	}

	if (event === 'payment.succeeded' && verifiedPayment.status === 'succeeded') {
		if (!paymentAmountMatchesOrder(verifiedPayment, getOrderPayableAmount(order.totalAmount, order.refundedAmount, order.order_status))) {
			console.error('[YooKassa] webhook amount mismatch', {
				orderId,
				paid: verifiedPayment?.amount?.value,
				expected: getOrderPayableAmount(order.totalAmount, order.refundedAmount, order.order_status),
			});
			return response.status(200).send('OK');
		}

		const paidUpdate = await OrderModel.updateOne(
			{ _id: orderId, order_status: ORDER_STATUS.WAITING_PAYMENT },
			{ order_status: ORDER_STATUS.PAID, paymentId: verifiedPayment.id },
		);

		if (paidUpdate.modifiedCount > 0) {
			await upsertSavedPaymentMethodFromYooPayment(order.userId, verifiedPayment);

			const user = await UserModel.findById(order.userId);
			if (user?.email) {
				const updatedOrder = await OrderModel.findById(orderId);
				await sendEmailFun({
					sendTo: [user.email],
					subject: 'Order Confirmation',
					text: '',
					html: OrderConfirmationEmail(user.name, updatedOrder),
				});
			}
		}
	} else if (
		(event === 'payment.canceled' && verifiedPayment.status === 'canceled') ||
		verifiedPayment.status === 'canceled'
	) {
		const payableLeft = getOrderPayableAmount(order.totalAmount, order.refundedAmount, order.order_status);
		if (payableLeft >= 0.01) {
			await OrderModel.updateOne(
				{ _id: orderId, order_status: ORDER_STATUS.WAITING_PAYMENT },
				{ paymentId: '' },
			);
		} else {
			const cancelUpdate = await OrderModel.updateOne(
				{ _id: orderId, order_status: ORDER_STATUS.WAITING_PAYMENT },
				{ order_status: ORDER_STATUS.CANCELLED },
			);

			if (cancelUpdate.modifiedCount > 0) {
				for (const item of order.products) {
					const qty = getRestorableQuantity(item);
					if (qty > 0) {
						await applyOrderStockIncrement(ProductModel, item.productId, qty, item);
					}
				}
			}
		}
	}

	return response.status(200).send('OK');
};

/**
 * POST /api/order/:id/sync-payment
 * Синхронизирует статус оплаты с ЮKassa (для страницы успеха, когда webhook не сработал, например на localhost).
 * Если платёж в ЮKassa в статусе succeeded — обновляет заказ на PAID.
 */
export const syncPaymentOrderController = async (request, response) => {
	try {
		const userId = request.userId;
		const orderId = request.params.id;
		if (!orderId) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Order id is required',
			});
		}

		const order = await OrderModel.findOne({ _id: orderId, userId }).lean();
		if (!order) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'Order not found',
			});
		}

		if (order.order_status === ORDER_STATUS.PAID) {
			return response.status(200).json({
				error: false,
				success: true,
				order_status: ORDER_STATUS.PAID,
				message: 'Order already paid',
			});
		}

		if (order.order_status !== ORDER_STATUS.WAITING_PAYMENT) {
			return response.status(200).json({
				error: false,
				success: true,
				order_status: order.order_status,
				message: 'Order is not waiting for payment',
			});
		}

		if (!order.paymentId || order.paymentId === '') {
			return response.status(200).json({
				error: false,
				success: true,
				order_status: ORDER_STATUS.WAITING_PAYMENT,
				message: 'No payment id to sync',
			});
		}

		const auth = getYooKassaAuth();
		const res = await fetch(`${YOOKASSA_API}/payments/${order.paymentId}`, {
			headers: { Authorization: `Basic ${auth}` },
		});
		if (!res.ok) {
			return response.status(200).json({
				error: false,
				success: true,
				order_status: ORDER_STATUS.WAITING_PAYMENT,
				message: 'Could not fetch payment status',
			});
		}

		const payment = await res.json();
		const paymentOrderId = String(payment.metadata?.orderId || '').trim();
		const requestedOrderId = String(orderId).trim();
		if (paymentOrderId !== requestedOrderId) {
			return response.status(200).json({
				error: false,
				success: true,
				order_status: ORDER_STATUS.WAITING_PAYMENT,
				message: 'Payment does not match order',
			});
		}

		// succeeded = оплата прошла; waiting_for_capture = двухстадийная оплата, деньги зарезервированы
		const isPaid = payment.status === 'succeeded' || payment.status === 'waiting_for_capture';
		if (isPaid) {
			if (!paymentAmountMatchesOrder(payment, getOrderPayableAmount(order.totalAmount, order.refundedAmount, order.order_status))) {
				console.error('[syncPayment] amount mismatch', {
					orderId,
					paid: payment?.amount?.value,
					expected: getOrderPayableAmount(order.totalAmount, order.refundedAmount, order.order_status),
				});
				return response.status(200).json({
					error: false,
					success: true,
					order_status: ORDER_STATUS.WAITING_PAYMENT,
					message: 'Payment amount mismatch',
				});
			}
			const paidUpdate = await OrderModel.updateOne(
				{ _id: orderId, userId, order_status: ORDER_STATUS.WAITING_PAYMENT },
				{ order_status: ORDER_STATUS.PAID, paymentId: payment.id },
			);
			if (paidUpdate.modifiedCount > 0) {
				await upsertSavedPaymentMethodFromYooPayment(userId, payment);
				const user = await UserModel.findById(userId);
				if (user?.email) {
					const updatedOrder = await OrderModel.findById(orderId);
					await sendEmailFun({
						sendTo: [user.email],
						subject: 'Order Confirmation',
						text: '',
						html: OrderConfirmationEmail(user.name, updatedOrder),
					});
				}
			}
			return response.status(200).json({
				error: false,
				success: true,
				order_status: ORDER_STATUS.PAID,
				message: 'Payment confirmed',
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			order_status: ORDER_STATUS.WAITING_PAYMENT,
			payment_status: payment.status,
			message: 'Payment not yet succeeded',
		});
	} catch (error) {
		console.error('[syncPayment] error:', error);
		return response.status(500).json({
			error: true,
			success: false,
			message: error.message || 'Sync failed',
		});
	}
};
