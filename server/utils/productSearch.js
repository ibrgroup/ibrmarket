import mongoose from 'mongoose';

/** Экранирование для безопасного использования строки в $regex */
export function escapeRegex(str) {
	return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Варианты запроса для русского поиска: множественное/единственное число, ё→е.
 * Пример: «футболки» → также «футболка», «футболк».
 */
export function buildRussianSearchVariants(rawQuery) {
	const trimmed = String(rawQuery).trim();
	if (!trimmed) return [];

	const variants = new Set();

	const addTokenVariants = (token) => {
		if (!token || token.length < 2) return;
		variants.add(token);

		const lower = token.toLowerCase();
		variants.add(lower);

		const normalized = lower.replace(/ё/g, 'е');
		if (normalized !== lower) variants.add(normalized);

		if (lower.length < 4) return;

		if (/[иы]$/.test(lower)) {
			const stem = lower.slice(0, -1);
			variants.add(stem);
			variants.add(`${stem}а`);
			variants.add(`${stem}о`);
			if (lower.length >= 5) variants.add(lower.slice(0, -2));
		}

		if (lower.endsWith('ка') && lower.length > 4) {
			const base = lower.slice(0, -2);
			variants.add(`${base}ки`);
			variants.add(`${base}ка`);
			variants.add(`${base}к`);
		}

		if (/(ок|ек)$/.test(lower) && lower.length > 4) {
			variants.add(`${lower.slice(0, -2)}ки`);
			variants.add(lower.slice(0, -1));
		}
	};

	addTokenVariants(trimmed);
	for (const word of trimmed.split(/\s+/).filter((w) => w.length >= 3)) {
		addTokenVariants(word);
	}

	if (variants.size === 0 && trimmed.length >= 1) {
		variants.add(trimmed);
		variants.add(trimmed.toLowerCase());
	}

	return [...variants].filter((v) => v.length >= 2);
}

const SEARCH_FIELDS = ['name', 'brand', 'catName', 'subCat', 'thirdsubCat', 'description'];

/**
 * Условия полнотекстового поиска + совпадение по _id (артикул = Mongo ObjectId).
 */
export function buildProductSearchOrConditions(rawQuery) {
	const variants = buildRussianSearchVariants(rawQuery);
	const orConditions = [];
	const seen = new Set();

	for (const variant of variants) {
		const escaped = escapeRegex(variant);
		for (const field of SEARCH_FIELDS) {
			const key = `${field}:${escaped}`;
			if (seen.has(key)) continue;
			seen.add(key);
			orConditions.push({ [field]: { $regex: escaped, $options: 'i' } });
		}
	}

	const trimmed = String(rawQuery).trim();
	if (/^[0-9a-fA-F]{24}$/.test(trimmed) && mongoose.Types.ObjectId.isValid(trimmed)) {
		orConditions.push({ _id: new mongoose.Types.ObjectId(trimmed) });
	}

	return orConditions;
}
