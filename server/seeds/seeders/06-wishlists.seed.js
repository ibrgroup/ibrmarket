import WishlistModel from '../../models/wishlist.model.js';

/**
 * @param {{ users: any[]; products: any[] }} ctx
 * @param {import('../../config/seed.config.js').defaultConfig} config
 */
export async function run(ctx, config) {
	const perUser = config.seedData.wishlistItemsPerUser ?? 0;
	if (perUser <= 0 || !ctx.products?.length) return { name: 'Wishlists', count: 0, created: [] };

	const regularUsers = ctx.users.filter((u) => u.role === 'USER');
	if (!regularUsers.length) return { name: 'Wishlists', count: 0, created: [] };

	const toInsert = [];
	for (const user of regularUsers) {
		const numItems = Math.min(perUser, ctx.products.length);
		const used = new Set();
		for (let w = 0; w < numItems; w++) {
			let idx = Math.floor(Math.random() * ctx.products.length);
			while (used.has(idx)) idx = (idx + 1) % ctx.products.length;
			used.add(idx);
			const p = ctx.products[idx];
			toInsert.push({
				productId: String(p._id),
				userId: String(user._id),
				productTitle: p.name,
				image: p.images?.[0] || '',
				rating: p.rating ?? 0,
				price: p.price,
				oldPrice: p.oldPrice ?? 0,
				brand: p.brand || '',
				discount: p.discount ?? 0,
			});
		}
	}
	const created = toInsert.length ? await WishlistModel.insertMany(toInsert) : [];
	ctx.wishlists = created;
	return { name: 'Wishlists', count: created.length, created };
}
