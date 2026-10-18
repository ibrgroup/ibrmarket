import CartModel from '../../models/cart.model.js';

/**
 * @param {{ users: any[]; products: any[] }} ctx
 * @param {import('../../config/seed.config.js').defaultConfig} config
 */
export async function run(ctx, config) {
	const perUser = config.seedData.cartItemsPerUser ?? 0;
	if (perUser <= 0 || !ctx.products?.length) return { name: 'Carts', count: 0, created: [] };

	const regularUsers = ctx.users.filter((u) => u.role === 'USER');
	if (!regularUsers.length) return { name: 'Carts', count: 0, created: [] };

	const toInsert = [];
	for (const user of regularUsers) {
		const numItems = Math.min(perUser, ctx.products.length);
		const used = new Set();
		for (let c = 0; c < numItems; c++) {
			let idx = Math.floor(Math.random() * ctx.products.length);
			while (used.has(idx)) idx = (idx + 1) % ctx.products.length;
			used.add(idx);
			const p = ctx.products[idx];
			const qty = 1 + Math.floor(Math.random() * 2);
			const subTotal = p.price * qty;
			toInsert.push({
				productTitle: p.name,
				image: p.images?.[0] || '',
				rating: p.rating ?? 0,
				price: p.price,
				oldPrice: p.oldPrice ?? 0,
				discount: p.discount ?? 0,
				quantity: qty,
				subTotal,
				productId: String(p._id),
				userId: String(user._id),
				brand: p.brand || '',
			});
		}
	}
	const created = toInsert.length ? await CartModel.insertMany(toInsert) : [];
	ctx.carts = created;
	return { name: 'Carts', count: created.length, created };
}
