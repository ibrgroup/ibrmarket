import mongoose from 'mongoose';
import AdminAuditLogModel from '../models/adminAuditLog.model.js';
import { ALL_USER_ROLES, isSuperAdminRole } from '../utils/roles.js';
import CategoryModel from '../models/category.model.js';
import ConversationModel from '../models/conversation.model.js';
import OrderModel from '../models/order.model.js';
import ProductModel from '../models/product.model.js';
import UserModel from '../models/user.model.js';
import { appendAdminAudit } from '../utils/adminAudit.js';
import { can, PERM } from '../utils/permissions.js';
import { getOrderPayableAmount } from '../utils/orderItemReturn.js';

function startOfUtcDay() {
	const d = new Date();
	d.setUTCHours(0, 0, 0, 0);
	return d;
}

const ORDER_STATUS_FILTER = ['WAITING_PAYMENT', 'PAID', 'CANCELLED', 'DELIVERED', 'REFUSED'];
const ORDER_PAYMENT_TYPES = ['YOOKASSA', 'ON_DELIVERY'];

function escapeRegex(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ORDER_SORT_FIELDS = {
	createdAt: 'createdAt',
	totalAmount: 'totalAmount',
	order_status: 'order_status',
};

/** Общий фильтр заказов для списка, счётчиков статусов и CSV-экспорта (без order_status). */
async function buildOrdersAdminBaseFilter(query) {
	const filter = {};

	const paymentType = (query.paymentType || '').trim().toUpperCase();
	if (ORDER_PAYMENT_TYPES.includes(paymentType)) {
		filter.payment_type = paymentType;
	}

	const userIdParam = (query.userId || '').trim();
	if (userIdParam && mongoose.isValidObjectId(userIdParam)) {
		filter.userId = new mongoose.Types.ObjectId(userIdParam);
	}

	const from = query.from ? new Date(query.from) : null;
	const to = query.to ? new Date(query.to) : null;
	const createdAt = {};
	if (from && !Number.isNaN(from.getTime())) createdAt.$gte = from;
	if (to && !Number.isNaN(to.getTime())) createdAt.$lte = to;
	if (Object.keys(createdAt).length) filter.createdAt = createdAt;

	const q = (query.q || '').trim();
	if (q) {
		const rx = new RegExp(escapeRegex(q), 'i');
		const or = [{ paymentId: rx }, { 'products.productTitle': rx }];
		if (mongoose.isValidObjectId(q)) {
			const oid = new mongoose.Types.ObjectId(q);
			or.push({ _id: oid });
			or.push({ userId: oid });
		}
		const users = await UserModel.find({
			$or: [{ name: rx }, { email: rx }, { mobile: rx }],
		})
			.select('_id')
			.lean()
			.limit(300);
		if (users.length) {
			or.push({ userId: { $in: users.map((u) => u._id) } });
		}
		filter.$or = or;
	}

	return filter;
}

export async function listOrdersAdmin(request, response) {
	try {
		const page = Math.max(1, parseInt(request.query.page, 10) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(request.query.limit, 10) || 20));

		const baseFilter = await buildOrdersAdminBaseFilter(request.query);

		const filter = { ...baseFilter };
		const statusParam = (request.query.status || '').trim().toUpperCase();
		if (statusParam && ORDER_STATUS_FILTER.includes(statusParam)) {
			filter.order_status = statusParam;
		}

		const sortKey = ORDER_SORT_FIELDS[request.query.sort] || 'createdAt';
		const sortDir = request.query.order === 'asc' ? 1 : -1;
		const sort = { [sortKey]: sortDir };

		const [orderlist, total, statusCountsAgg] = await Promise.all([
			OrderModel.find(filter)
				.sort(sort)
				.populate('delivery_address')
				.populate({ path: 'userId', select: 'name email mobile role' })
				.skip((page - 1) * limit)
				.limit(limit)
				.lean(),
			OrderModel.countDocuments(filter),
			OrderModel.aggregate([
				{ $match: baseFilter },
				{ $group: { _id: '$order_status', count: { $sum: 1 } } },
			]),
		]);

		const statusCounts = {};
		for (const row of statusCountsAgg) {
			statusCounts[row._id] = row.count;
		}

		return response.json({
			message: 'order list',
			data: orderlist,
			error: false,
			success: true,
			total,
			page,
			totalPages: Math.ceil(total / limit) || 1,
			statusCounts,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function getOrderByIdAdmin(request, response) {
	try {
		const orderId = request.params.id;
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

		const order = await OrderModel.findById(orderId)
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

export async function exportOrdersCsvAdmin(request, response) {
	try {
		const maxRows = Math.min(5000, Math.max(1, parseInt(request.query.max, 10) || 2000));

		const filter = await buildOrdersAdminBaseFilter(request.query);
		const statusParam = (request.query.status || '').trim().toUpperCase();
		if (statusParam && ORDER_STATUS_FILTER.includes(statusParam)) {
			filter.order_status = statusParam;
		}

		const orders = await OrderModel.find(filter)
			.sort({ createdAt: -1 })
			.limit(maxRows)
			.select('_id userId order_status payment_type delivery_method totalAmount refundedAmount products createdAt')
			.populate({ path: 'userId', select: 'name email mobile' })
			.lean();

		const header =
			'id,customerName,customerEmail,customerPhone,order_status,payment_type,delivery_method,itemsCount,items,totalAmount,payableAmount,createdAt\n';
		const lines = orders.map((o) => {
			const user = o.userId && typeof o.userId === 'object' ? o.userId : null;
			const items = Array.isArray(o.products)
				? o.products
						.map((p) => {
							const bits = [];
							if (p.size) bits.push(`размер:${p.size}`);
							if (p.color) bits.push(`цвет:${p.color}`);
							if (p.ram) bits.push(`RAM:${p.ram}`);
							if (p.weight) bits.push(`вес:${p.weight}`);
							const extra = bits.length ? ` [${bits.join('; ')}]` : '';
							return `${p.productTitle}${extra} x${p.quantity ?? 1}`;
						})
						.join('; ')
				: '';
			return [
				o._id,
				user?.name ?? (o.userId && !user ? o.userId : ''),
				user?.email ?? '',
				user?.mobile ?? '',
				o.order_status,
				o.payment_type ?? '',
				o.delivery_method ?? '',
				Array.isArray(o.products) ? o.products.length : 0,
				items,
				o.totalAmount,
				getOrderPayableAmount(o.totalAmount, o.refundedAmount, o.order_status),
				o.createdAt ? new Date(o.createdAt).toISOString() : '',
			]
				.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
				.join(',');
		});
		const csv = '\uFEFF' + header + lines.join('\n');

		response.setHeader('Content-Type', 'text/csv; charset=utf-8');
		response.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
		return response.send(csv);
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function listUsersAdmin(request, response) {
	try {
		const page = Math.max(1, parseInt(request.query.page, 10) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(request.query.limit, 10) || 20));
		const q = (request.query.q || '').trim();

		const filter = {};
		if (q) {
			const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
			filter.$or = [{ name: rx }, { email: rx }, { mobile: rx }];
		}

		const USER_SORT_FIELDS = {
			createdAt: 'createdAt',
			name: 'name',
			role: 'role',
			email: 'email',
		};
		const uSortKey = USER_SORT_FIELDS[request.query.sort] || 'createdAt';
		const uSortDir = request.query.order === 'asc' ? 1 : -1;

		const [users, total] = await Promise.all([
			UserModel.find(filter)
				.select('name email mobile role status avatar createdAt updatedAt')
				.sort({ [uSortKey]: uSortDir })
				.skip((page - 1) * limit)
				.limit(limit)
				.lean(),
			UserModel.countDocuments(filter),
		]);

		return response.status(200).json({
			error: false,
			success: true,
			users,
			total,
			page,
			totalPages: Math.ceil(total / limit) || 1,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || 'Internal error',
			error: true,
			success: false,
		});
	}
}

export async function listCategoriesAdmin(request, response) {
	try {
		const categories = await CategoryModel.find()
			.select('name parentId images createdAt')
			.sort({ name: 1 })
			.lean();

		return response.status(200).json({
			error: false,
			success: true,
			categories,
			total: categories.length,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || 'Internal error',
			error: true,
			success: false,
		});
	}
}

export async function listProductsAdmin(request, response) {
	try {
		const pageNum = Math.max(1, parseInt(request.query.page, 10) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(request.query.limit, 10) || 20));
		const search = (request.query.q || '').trim();

		const query = {};
		if (search) {
			query.name = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
		}

		const categoryParam = (request.query.category || '').trim();
		if (categoryParam && mongoose.isValidObjectId(categoryParam)) {
			query.category = new mongoose.Types.ObjectId(categoryParam);
		}

		const stockParam = (request.query.stock || '').trim();
		if (stockParam === 'out') {
			query.countInStock = { $lte: 0 };
		} else if (stockParam === 'low') {
			query.countInStock = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };
		}

		const featuredParam = (request.query.featured || '').trim();
		if (featuredParam === 'true') {
			query.isFeatured = true;
		} else if (featuredParam === 'false') {
			query.isFeatured = { $ne: true };
		}

		const PRODUCT_SORT_FIELDS = {
			createdAt: 'createdAt',
			price: 'price',
			name: 'name',
			countInStock: 'countInStock',
			brand: 'brand',
		};
		const pSortKey = PRODUCT_SORT_FIELDS[request.query.sort] || 'createdAt';
		const pSortDir = request.query.order === 'asc' ? 1 : -1;

		const total = await ProductModel.countDocuments(query);
		const products = await ProductModel.find(query)
			.sort({ [pSortKey]: pSortDir })
			.skip((pageNum - 1) * limitNum)
			.limit(limitNum)
			.populate('category', 'name slug')
			.lean();

		return response.status(200).json({
			error: false,
			success: true,
			products,
			total,
			page: pageNum,
			totalPages: Math.ceil(total / limitNum) || 1,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || 'Internal error',
			error: true,
			success: false,
		});
	}
}

const REVENUE_STATUSES = ['PAID', 'DELIVERED'];
const NET_ORDER_REVENUE = {
	$max: [0, { $subtract: ['$totalAmount', { $ifNull: ['$refundedAmount', 0] }] }],
};
const LOW_STOCK_THRESHOLD = 5;

function parseAnalyticsPeriod(query) {
	const now = new Date();
	let to = now;
	let from = null;

	const toParam = query.to ? new Date(query.to) : null;
	const fromParam = query.from ? new Date(query.from) : null;
	if (toParam && !Number.isNaN(toParam.getTime())) to = toParam;
	if (fromParam && !Number.isNaN(fromParam.getTime())) from = fromParam;

	if (!from) {
		const days = Math.min(365, Math.max(1, parseInt(query.days, 10) || 30));
		from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
	}

	if (from >= to) {
		from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
	}

	return { from, to };
}

export async function getAnalyticsAdmin(request, response) {
	try {
		const { from, to } = parseAnalyticsPeriod(request.query);
		const periodMs = to.getTime() - from.getTime();
		const prevFrom = new Date(from.getTime() - periodMs);
		const createdInPeriod = { createdAt: { $gte: from, $lte: to } };
		const createdInPrevPeriod = { createdAt: { $gte: prevFrom, $lt: from } };

		const [
			revenueByDay,
			statusBreakdown,
			periodTotals,
			prevTotals,
			newUsers,
			newUsersPrev,
			topProducts,
			lowStock,
		] = await Promise.all([
			OrderModel.aggregate([
				{ $match: { ...createdInPeriod, order_status: { $in: REVENUE_STATUSES } } },
				{
					$group: {
						_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
						revenue: { $sum: NET_ORDER_REVENUE },
						orders: { $sum: 1 },
					},
				},
				{ $sort: { _id: 1 } },
				{ $project: { _id: 0, date: '$_id', revenue: 1, orders: 1 } },
			]),
			OrderModel.aggregate([
				{ $match: createdInPeriod },
				{ $group: { _id: '$order_status', count: { $sum: 1 } } },
				{ $project: { _id: 0, status: '$_id', count: 1 } },
			]),
			OrderModel.aggregate([
				{ $match: { ...createdInPeriod, order_status: { $in: REVENUE_STATUSES } } },
				{ $group: { _id: null, revenue: { $sum: NET_ORDER_REVENUE }, orders: { $sum: 1 } } },
			]),
			OrderModel.aggregate([
				{ $match: { ...createdInPrevPeriod, order_status: { $in: REVENUE_STATUSES } } },
				{ $group: { _id: null, revenue: { $sum: NET_ORDER_REVENUE }, orders: { $sum: 1 } } },
			]),
			UserModel.countDocuments(createdInPeriod),
			UserModel.countDocuments(createdInPrevPeriod),
			OrderModel.aggregate([
				{ $match: { ...createdInPeriod, order_status: { $in: REVENUE_STATUSES } } },
				{ $unwind: '$products' },
				{
					$group: {
						_id: '$products.productId',
						title: { $first: '$products.productTitle' },
						image: { $first: '$products.image' },
						quantity: {
							$sum: {
								$max: [
									0,
									{
										$subtract: [
											{ $ifNull: ['$products.quantity', 1] },
											{ $ifNull: ['$products.returnedQuantity', 0] },
										],
									},
								],
							},
						},
						revenue: {
							$sum: {
								$max: [
									0,
									{
										$subtract: [
											{ $ifNull: ['$products.subTotal', 0] },
											{ $ifNull: ['$products.refundAmount', 0] },
										],
									},
								],
							},
						},
					},
				},
				{ $sort: { quantity: -1 } },
				{ $limit: 5 },
				{
					$project: {
						_id: 0,
						productId: '$_id',
						title: 1,
						image: 1,
						quantity: 1,
						revenue: 1,
					},
				},
			]),
			ProductModel.find({ countInStock: { $lte: LOW_STOCK_THRESHOLD } })
				.select('name countInStock price images')
				.sort({ countInStock: 1 })
				.limit(8)
				.lean(),
		]);

		const revenue = periodTotals[0]?.revenue ?? 0;
		const paidOrders = periodTotals[0]?.orders ?? 0;
		const revenuePrev = prevTotals[0]?.revenue ?? 0;
		const paidOrdersPrev = prevTotals[0]?.orders ?? 0;

		return response.status(200).json({
			error: false,
			success: true,
			analytics: {
				period: { from: from.toISOString(), to: to.toISOString() },
				revenueByDay,
				statusBreakdown,
				totals: {
					revenue,
					paidOrders,
					averageOrderValue: paidOrders > 0 ? revenue / paidOrders : 0,
					newUsers,
				},
				previous: {
					revenue: revenuePrev,
					paidOrders: paidOrdersPrev,
					averageOrderValue: paidOrdersPrev > 0 ? revenuePrev / paidOrdersPrev : 0,
					newUsers: newUsersPrev,
				},
				topProducts,
				lowStock: lowStock.map((p) => ({
					productId: p._id,
					name: p.name,
					countInStock: p.countInStock,
					price: p.price,
					image: Array.isArray(p.images) ? p.images[0] || null : null,
				})),
			},
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || 'Internal error',
			error: true,
			success: false,
		});
	}
}

export async function getMetricsAdmin(request, response) {
	try {
		const startDay = startOfUtcDay();

		const [ordersTotal, ordersToday, usersTotal, productsTotal, paidAgg] = await Promise.all([
			OrderModel.countDocuments(),
			OrderModel.countDocuments({ createdAt: { $gte: startDay } }),
			UserModel.countDocuments(),
			ProductModel.countDocuments(),
			OrderModel.aggregate([
				{ $match: { order_status: 'PAID' } },
				{ $group: { _id: null, revenue: { $sum: NET_ORDER_REVENUE } } },
			]),
		]);

		const revenuePaid = paidAgg[0]?.revenue ?? 0;

		return response.status(200).json({
			error: false,
			success: true,
			metrics: {
				ordersTotal,
				ordersToday,
				usersTotal,
				productsTotal,
				revenuePaid,
			},
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || 'Internal error',
			error: true,
			success: false,
		});
	}
}

/** Лёгкие счётчики для сайдбара: только те, на которые есть право. */
export async function getBadgesAdmin(request, response) {
	try {
		const role = request.userRole;
		const wantOrders = can(role, PERM.ORDERS);
		const wantInbox = can(role, PERM.INBOX);

		const [activeOrders, openConversations] = await Promise.all([
			wantOrders
				? OrderModel.countDocuments({ order_status: { $in: ['WAITING_PAYMENT', 'PAID'] } })
				: Promise.resolve(0),
			wantInbox
				? ConversationModel.countDocuments({ kind: 'support', status: 'open' })
				: Promise.resolve(0),
		]);

		return response.status(200).json({
			error: false,
			success: true,
			badges: {
				activeOrders: wantOrders ? activeOrders : 0,
				openConversations: wantInbox ? openConversations : 0,
			},
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || 'Internal error',
			error: true,
			success: false,
		});
	}
}

export async function getSettingsPublicAdmin(request, response) {
	try {
		return response.status(200).json({
			error: false,
			success: true,
			settings: {
				nodeEnv: process.env.NODE_ENV || 'development',
				frontendUrl: process.env.FRONTEND_URL || null,
				hasYooKassa: Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY),
				hasCloudinary: Boolean(
					process.env.cloudinary_Config_Cloud_Name && process.env.cloudinary_Config_api_key,
				),
			},
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || 'Internal error',
			error: true,
			success: false,
		});
	}
}

export async function patchUserRoleAdmin(request, response) {
	try {
		const { id } = request.params;
		const { role } = request.body || {};

		if (!mongoose.isValidObjectId(id)) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid user id',
			});
		}

		if (!ALL_USER_ROLES.includes(role)) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid role',
			});
		}

		if (String(request.userId) === String(id) && !isSuperAdminRole(role)) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Cannot demote yourself',
			});
		}

		const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true }).select(
			'name email mobile role status createdAt',
		);

		if (!user) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'User not found',
			});
		}

		await appendAdminAudit(request.userId, 'user.role_update', {
			entityType: 'user',
			entityId: id,
			metadata: { role },
		});

		return response.json({
			success: true,
			error: false,
			user,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

const USER_STATUSES = ['Active', 'Inactive', 'Suspended'];

export async function patchUserStatusAdmin(request, response) {
	try {
		const { id } = request.params;
		const { status } = request.body || {};

		if (!mongoose.isValidObjectId(id)) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid user id',
			});
		}

		if (!USER_STATUSES.includes(status)) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid status',
			});
		}

		if (String(request.userId) === String(id) && status !== 'Active') {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Cannot block yourself',
			});
		}

		const update = { status };
		// При блокировке отзываем refresh-токен: пользователь вылетит при следующем обновлении сессии
		if (status !== 'Active') {
			update.refresh_token = '';
		}

		const user = await UserModel.findByIdAndUpdate(id, update, { new: true }).select(
			'name email mobile role status createdAt',
		);

		if (!user) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'User not found',
			});
		}

		await appendAdminAudit(request.userId, 'user.status_update', {
			entityType: 'user',
			entityId: id,
			metadata: { status },
		});

		return response.json({
			success: true,
			error: false,
			user,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function deleteUserAdmin(request, response) {
	try {
		const { id } = request.params;

		if (!mongoose.isValidObjectId(id)) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid user id',
			});
		}

		if (String(request.userId) === String(id)) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Cannot delete your own account',
			});
		}

		const existing = await UserModel.findById(id);
		if (!existing) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'User not found',
			});
		}

		await UserModel.findByIdAndDelete(id);

		await appendAdminAudit(request.userId, 'user.delete', {
			entityType: 'user',
			entityId: id,
		});

		return response.status(200).json({
			success: true,
			error: false,
			message: 'User deleted',
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function listAuditLogsAdmin(request, response) {
	try {
		const page = Math.max(1, parseInt(request.query.page, 10) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(request.query.limit, 10) || 50));
		const actionQ = (request.query.q || '').trim();

		const filter = {};
		if (actionQ) {
			filter.action = new RegExp(actionQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
		}

		const entityTypeParam = (request.query.entityType || '').trim();
		if (entityTypeParam) {
			filter.entityType = entityTypeParam;
		}

		const actorParam = (request.query.actor || '').trim();
		if (actorParam) {
			if (mongoose.isValidObjectId(actorParam)) {
				filter.actorUserId = new mongoose.Types.ObjectId(actorParam);
			} else {
				const rx = new RegExp(escapeRegex(actorParam), 'i');
				const actors = await UserModel.find({ $or: [{ name: rx }, { email: rx }] })
					.select('_id')
					.limit(200)
					.lean();
				filter.actorUserId = { $in: actors.map((u) => u._id) };
			}
		}

		const from = request.query.from ? new Date(request.query.from) : null;
		const to = request.query.to ? new Date(request.query.to) : null;
		const createdAt = {};
		if (from && !Number.isNaN(from.getTime())) createdAt.$gte = from;
		if (to && !Number.isNaN(to.getTime())) createdAt.$lte = to;
		if (Object.keys(createdAt).length) filter.createdAt = createdAt;

		const AUDIT_SORT_FIELDS = {
			createdAt: 'createdAt',
			action: 'action',
		};
		const aSortKey = AUDIT_SORT_FIELDS[request.query.sort] || 'createdAt';
		const aSortDir = request.query.order === 'asc' ? 1 : -1;

		const [logs, total] = await Promise.all([
			AdminAuditLogModel.find(filter)
				.sort({ [aSortKey]: aSortDir })
				.populate({ path: 'actorUserId', select: 'name email role' })
				.skip((page - 1) * limit)
				.limit(limit)
				.lean(),
			AdminAuditLogModel.countDocuments(filter),
		]);

		return response.status(200).json({
			success: true,
			error: false,
			logs,
			total,
			page,
			totalPages: Math.ceil(total / limit) || 1,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || 'Internal error',
			error: true,
			success: false,
		});
	}
}
