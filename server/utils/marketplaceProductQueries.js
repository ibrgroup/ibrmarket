import mongoose from 'mongoose';
import CategoryModel from '../models/category.model.js';
import ProductModel from '../models/product.model.js';
import {
	buildCategoryChildrenByParentId,
	collectDescendantCategoryIds,
} from './categorySubtree.js';

/**
 * Фрагмент фильтра Mongo: товары в поддереве категорий (как в getAllProducts).
 * @param {Iterable<string>} anchorIds — строковые ObjectId категорий (ref category или catId)
 * @returns {Promise<object|null>} `{ $or: [...] }` или null, если якорей нет / дерево пустое
 */
export async function buildProductCategoryScopeOr(anchorIds) {
	const unique = [...new Set([...anchorIds].map((a) => String(a).trim()).filter(Boolean))];
	const validAnchors = unique.filter((id) => mongoose.Types.ObjectId.isValid(id));
	if (validAnchors.length === 0) return null;

	const allCats = await CategoryModel.find({}).select('_id parentId').lean();
	const tree = buildCategoryChildrenByParentId(allCats);
	const subtreeUnion = new Set();
	for (const aid of validAnchors) {
		for (const id of collectDescendantCategoryIds(String(aid), tree)) {
			subtreeUnion.add(id);
		}
	}
	if (subtreeUnion.size === 0) return null;

	const idStrings = [...subtreeUnion];
	const objectIds = idStrings.map((id) => new mongoose.Types.ObjectId(id));
	return {
		$or: [
			{ catId: { $in: idStrings } },
			{ subCatId: { $in: idStrings } },
			{ thirdsubCatId: { $in: idStrings } },
			{ category: { $in: objectIds } },
		],
	};
}

/**
 * Популярные товары: сначала featured с остатком, затем по рейтингу и продажам.
 */
export async function buildPopularProductsList(limitNum) {
	const capped = Math.min(48, Math.max(1, limitNum));
	const featured = await ProductModel.find({ isFeatured: true, countInStock: { $gt: 0 } })
		.sort({ rating: -1, createdAt: -1 })
		.limit(Math.min(capped, 12))
		.populate('category', 'name slug');
	const ids = new Set(featured.map((p) => String(p._id)));
	const restLimit = capped - featured.length;
	let rest = [];
	if (restLimit > 0) {
		const oidList = [...ids]
			.filter((id) => mongoose.Types.ObjectId.isValid(id))
			.map((id) => new mongoose.Types.ObjectId(id));
		const restQuery = { countInStock: { $gt: 0 } };
		if (oidList.length > 0) {
			restQuery._id = { $nin: oidList };
		}
		rest = await ProductModel.find(restQuery)
			.sort({ rating: -1, sale: -1, createdAt: -1 })
			.limit(restLimit)
			.populate('category', 'name slug');
	}
	return [...featured, ...rest];
}

/**
 * Добор товаров с глобальной витрины (исключая переданные id).
 */
export async function fillProductsFromGlobalPopular({
	excludeIds,
	need,
	sortFeaturedFirst = true,
}) {
	if (need <= 0) return [];
	const oidExclude = [...excludeIds]
		.filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
		.map((id) => new mongoose.Types.ObjectId(String(id)));
	const sort = sortFeaturedFirst
		? { isFeatured: -1, rating: -1, createdAt: -1 }
		: { rating: -1, createdAt: -1 };
	// $nin: [] в MongoDB совпадает со всеми _id — не добавляем поле, если исключать нечего
	const filter = { countInStock: { $gt: 0 } };
	if (oidExclude.length > 0) {
		filter._id = { $nin: oidExclude };
	}
	return ProductModel.find(filter).sort(sort).limit(need).populate('category', 'name slug');
}
