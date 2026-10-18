import OrderModel from '../../models/order.model.js';

const ORDER_STATUSES = ['WAITING_PAYMENT', 'PAID', 'DELIVERED', 'CANCELLED'];

/**
 * @param {{ users: any[]; addresses: any[]; products: any[] }} ctx
 * @param {import('../../config/seed.config.js').defaultConfig} config
 */
export async function run(ctx, config) {
	const perUser = config.seedData.ordersPerUser ?? 0;
	if (perUser <= 0 || !ctx.products?.length) return { name: 'Orders', count: 0, created: [] };

	const usersWithAddresses = ctx.users.filter(
		(u) =>
			u.role === 'USER' && ctx.addresses.some((a) => a.userId?.toString() === u._id.toString()),
	);
	if (!usersWithAddresses.length) return { name: 'Orders', count: 0, created: [] };

	const toInsert = [];
	for (const user of usersWithAddresses) {
		const userAddresses = ctx.addresses.filter((a) => a.userId?.toString() === user._id.toString());
		if (!userAddresses.length) continue;

		for (let o = 0; o < perUser; o++) {
			const numItems = 1 + Math.floor(Math.random() * 4);
			const selectedProducts = [];
			const used = new Set();
			while (selectedProducts.length < numItems) {
				const idx = Math.floor(Math.random() * ctx.products.length);
				if (used.has(idx)) continue;
				used.add(idx);
				const p = ctx.products[idx];
				const qty = 1 + Math.floor(Math.random() * 3);
				const price = p.price;
				const subTotal = price * qty;
				const sizes = Array.isArray(p.size) ? p.size.filter(Boolean) : [];
				const colors = Array.isArray(p.colors) ? p.colors.filter(Boolean) : [];
				selectedProducts.push({
					productId: String(p._id),
					productTitle: p.name,
					quantity: qty,
					price,
					image: p.images?.[0] || '',
					subTotal,
					brand: p.brand || '',
					size: sizes.length ? sizes[Math.floor(Math.random() * sizes.length)] : '',
					color: colors.length ? colors[Math.floor(Math.random() * colors.length)] : '',
					ram: '',
					weight: '',
					discount: p.discount || 0,
				});
			}
			const totalAmount = selectedProducts.reduce((s, i) => s + i.subTotal, 0);
			const delivery_address = userAddresses[o % userAddresses.length]._id;
			toInsert.push({
				userId: user._id,
				products: selectedProducts,
				order_status: ORDER_STATUSES[o % ORDER_STATUSES.length],
				delivery_address,
				delivery_method: o % 3 === 0 ? 'pickup' : 'courier',
				totalAmount,
				paymentId: '',
				reservedAt: new Date(),
			});
		}
	}
	const created = toInsert.length ? await OrderModel.insertMany(toInsert) : [];
	ctx.orders = created;
	return { name: 'Orders', count: created.length, created };
}
