/**
 * Опциональные остатки по вариантам (размер / цвет / вес / RAM).
 * Если variantStock пустой или отсутствует — используется только product.countInStock (как раньше).
 */

export function normStockAttr(v) {
	if (v == null || v === undefined) return '';
	return String(v).trim();
}

function lineVariantFields(line) {
	return {
		size: normStockAttr(line?.size),
		color: normStockAttr(line?.color),
		weight: normStockAttr(line?.weight),
		ram: normStockAttr(line?.ram),
	};
}

function rowMatchesLine(row, lineFields) {
	const r = {
		size: normStockAttr(row?.size),
		color: normStockAttr(row?.color),
		weight: normStockAttr(row?.weight),
		ram: normStockAttr(row?.ram),
	};
	return (
		r.size === lineFields.size &&
		r.color === lineFields.color &&
		r.weight === lineFields.weight &&
		r.ram === lineFields.ram
	);
}

/**
 * @param {import('mongoose').Document | object} product
 * @param {object} line — элемент корзины / заказа с полями size, color, weight, ram
 * @returns {number} индекс в variantStock или -1
 */
export function findVariantStockIndex(product, line) {
	const rows = product?.variantStock;
	if (!Array.isArray(rows) || rows.length === 0) return -1;
	const lf = lineVariantFields(line);
	for (let i = 0; i < rows.length; i++) {
		if (rowMatchesLine(rows[i], lf)) return i;
	}
	return -1;
}

/**
 * Доступное количество для строки корзины (учёт variantStock при наличии совпадения).
 */
export function getAvailableStockForLine(product, line) {
	if (!product) return 0;
	const rows = product.variantStock;
	if (Array.isArray(rows) && rows.length > 0) {
		const idx = findVariantStockIndex(product, line);
		if (idx >= 0) {
			return Math.max(0, Math.floor(Number(rows[idx].count) || 0));
		}
	}
	return Math.max(0, Math.floor(Number(product.countInStock) || 0));
}

/**
 * Нормализация массива для сохранения в Product.
 * @param {unknown} raw
 * @returns {Array<{ size: string, color: string, weight: string, ram: string, count: number }>|undefined}
 */
export function normalizeVariantStockForSave(raw) {
	if (!Array.isArray(raw)) return undefined;
	const out = [];
	for (const row of raw) {
		if (!row || typeof row !== 'object') continue;
		const count = Math.max(0, Math.floor(Number(row.count) || 0));
		out.push({
			size: normStockAttr(row.size),
			color: normStockAttr(row.color),
			weight: normStockAttr(row.weight),
			ram: normStockAttr(row.ram),
			count,
		});
	}
	return out;
}

/**
 * Списание при создании заказа: при совпадении строки variantStock уменьшаем слот и countInStock;
 * иначе только countInStock (legacy).
 */
export async function applyOrderStockDecrement(ProductModel, productId, quantity, line) {
	const product = await ProductModel.findById(productId).lean();
	if (!product) return;
	const idx = findVariantStockIndex(product, line);
	const q = Math.max(0, Math.floor(Number(quantity) || 0));
	if (q <= 0) return;

	if (idx >= 0) {
		await ProductModel.updateOne(
			{ _id: productId },
			{
				$inc: {
					[`variantStock.${idx}.count`]: -q,
					countInStock: -q,
					sale: q,
				},
			},
		);
		return;
	}

	await ProductModel.updateOne(
		{ _id: productId },
		{
			$inc: { countInStock: -q, sale: q },
		},
	);
}

/**
 * Возврат остатков (отмена оплаты и т.п.) — симметрично applyOrderStockDecrement.
 */
export async function applyOrderStockIncrement(ProductModel, productId, quantity, line) {
	const product = await ProductModel.findById(productId).lean();
	if (!product) return;
	const idx = findVariantStockIndex(product, line);
	const q = Math.max(0, Math.floor(Number(quantity) || 0));
	if (q <= 0) return;

	if (idx >= 0) {
		await ProductModel.updateOne(
			{ _id: productId },
			{
				$inc: {
					[`variantStock.${idx}.count`]: q,
					countInStock: q,
					sale: -q,
				},
			},
		);
		return;
	}

	await ProductModel.updateOne(
		{ _id: productId },
		{
			$inc: { countInStock: q, sale: -q },
		},
	);
}
