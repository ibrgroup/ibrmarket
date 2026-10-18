import ProductModel from '../../models/product.model.js';
import { PRODUCTS_POOL } from '../data/index.js';

/** Варианты размера/цвета по категории (витрина одежды / обуви / смартфонов) */
const APPAREL_KEYS = new Set([
	'Футболки и поло',
	'Рубашки',
	'Брюки и джинсы',
	'Верхняя одежда',
	'Платья',
	'Блузки и рубашки',
	'Юбки',
]);
const SHOE_KEYS = new Set(['Кроссовки', 'Туфли', 'Ботинки', 'Балетки', 'Сапоги']);
const PHONE_KEYS = new Set(['Смартфоны']);

function variantFieldsForCategory(categoryKey) {
	if (APPAREL_KEYS.has(categoryKey)) {
		return {
			size: ['S', 'M', 'L', 'XL'],
			colors: ['Чёрный', 'Белый', 'Синий', 'Серый'],
		};
	}
	if (SHOE_KEYS.has(categoryKey)) {
		return {
			size: ['39', '40', '41', '42', '43', '44', '45'],
			colors: ['Чёрный', 'Белый', 'Коричневый'],
		};
	}
	if (PHONE_KEYS.has(categoryKey)) {
		return {
			productRam: ['8/128 ГБ', '8/256 ГБ', '12/256 ГБ'],
			productWeight: ['171 г', '175 г', '180 г'],
		};
	}
	return {};
}

/**
 * @param {{ categories: any[]; categoryByName: Map<string, any>; products: any[] }} ctx
 * @param {import('../../config/seed.config.js').defaultConfig} config
 */
export async function run(ctx, config) {
	const targetCount = config.seedData.products ?? 0;
	if (targetCount <= 0 || !ctx.categoryByName?.size) {
		return { name: 'Products', count: 0, created: [] };
	}

	const pool = PRODUCTS_POOL.filter((p) => ctx.categoryByName.has(p.categoryKey));
	if (!pool.length) {
		const fallbackCat = ctx.categories[ctx.categories.length - 1];
		if (!fallbackCat) return { name: 'Products', count: 0, created: [] };
	}

	const created = [];
	for (let i = 0; i < targetCount; i++) {
		const template = pool[i % pool.length];
		const cat = ctx.categoryByName.get(template.categoryKey) || ctx.categories[0];
		const variantFields = variantFieldsForCategory(template.categoryKey);
		const price = Math.floor(200 + Math.random() * 15000);
		const oldPrice = Math.floor(price * (1.1 + Math.random() * 0.4));
		const discount = Math.min(60, Math.floor((1 - price / oldPrice) * 100)) || 5;
		const rating = +(3.5 + Math.random() * 1.5).toFixed(1);
		const suffix = targetCount > pool.length ? ` ${i + 1}` : '';
		const product = await ProductModel.create({
			name: template.name + suffix,
			description: template.description,
			images: [`https://rst-basket-cdn-12.geobasket.ru/vol9902/part990236/990236286/images/big/1.webp=${i}`],
			brand: template.brand,
			price,
			oldPrice,
			catName: cat.name,
			catId: String(cat._id),
			category: cat._id,
			countInStock: Math.floor(5 + Math.random() * 95),
			rating,
			discount,
			isFeatured: Math.random() > 0.75,
			sale: Math.random() > 0.6 ? Math.floor(Math.random() * 25) : 0,
			...variantFields,
		});
		created.push(product);
	}
	ctx.products = created;
	return { name: 'Products', count: created.length, created };
}
