import ReviewModel from '../../models/reviews.model.js';

const REVIEW_TEXTS = [
	'Отличный товар, полностью соответствует описанию. Рекомендую.',
	'Быстрая доставка, качество на высоте. Спасибо!',
	'Всё понравилось, буду заказывать ещё.',
	'Нормальное качество за свою цену.',
	'Пришло быстрее срока, упаковано аккуратно.',
	'Хороший выбор для подарка. Доволен.',
	'Первый раз заказывал здесь — впечатления положительные.',
	'Качество отличное, только размер пришел чуть маловат.',
	'Всё как на фото. Рекомендую магазин.',
	'Долго выбирал, не ошибся. Товар надёжный.',
];

/**
 * @param {{ users: any[]; products: any[] }} ctx
 * @param {import('../../config/seed.config.js').defaultConfig} config
 */
export async function run(ctx, config) {
	const perProduct = config.seedData.reviewsPerProduct ?? 0;
	if (perProduct <= 0 || !ctx.products?.length || !ctx.users?.length) {
		return { name: 'Reviews', count: 0, created: [] };
	}

	const regularUsers = ctx.users.filter((u) => u.role === 'USER');
	if (!regularUsers.length) return { name: 'Reviews', count: 0, created: [] };

	const toInsert = [];
	for (const product of ctx.products) {
		const numReviews = Math.min(perProduct, regularUsers.length);
		const usedUsers = new Set();
		for (let r = 0; r < numReviews; r++) {
			let uIdx = Math.floor(Math.random() * regularUsers.length);
			while (usedUsers.has(uIdx)) uIdx = (uIdx + 1) % regularUsers.length;
			usedUsers.add(uIdx);
			const user = regularUsers[uIdx];
			const rating = 3 + Math.floor(Math.random() * 3);
			toInsert.push({
				userName: user.name,
				userId: String(user._id),
				productId: String(product._id),
				review: REVIEW_TEXTS[r % REVIEW_TEXTS.length],
				rating,
				helpfulCount: Math.floor(Math.random() * 20),
				isModerated: true,
			});
		}
	}
	const created = toInsert.length ? await ReviewModel.insertMany(toInsert) : [];
	ctx.reviews = created;
	return { name: 'Reviews', count: created.length, created };
}
