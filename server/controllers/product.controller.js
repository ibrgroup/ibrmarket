import mongoose from 'mongoose';
import { normalizeVariantStockForSave } from '../utils/variantStock.js';
import CategoryModel from '../models/category.model.js';
import OrderModel from '../models/order.model.js';
import ProductModel from '../models/product.model.js';
import {
	buildPopularProductsList,
	buildProductCategoryScopeOr,
	fillProductsFromGlobalPopular,
} from '../utils/marketplaceProductQueries.js';
import ProductRAMSModel from '../models/productRAMS.js';
import ProductSIZEModel from '../models/productSIZE.js';
import ProductWEIGHTModel from '../models/productWEIGHT.js';
import { appendAdminAudit } from '../utils/adminAudit.js';
import {
	buildCategoryChildrenByParentId,
	collectDescendantCategoryIds,
} from '../utils/categorySubtree.js';
import { buildProductSearchOrConditions } from '../utils/productSearch.js';
import {
	computeDHashFromBuffer,
	computeDHashFromUrl,
	hammingDistance,
} from '../utils/image-similarity.js';

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
	cloud_name: process.env.cloudinary_Config_Cloud_Name,
	api_key: process.env.cloudinary_Config_api_key,
	api_secret: process.env.cloudinary_Config_api_secret,
	secure: true,
});

//image upload
let imagesArr = [];
export async function uploadImages(request, response) {
	try {
		imagesArr = [];

		const image = request.files;

		const options = {
			use_filename: true,
			unique_filename: false,
			overwrite: false,
		};

		for (let i = 0; i < image?.length; i++) {
			const img = await cloudinary.uploader.upload(
				image[i].path,
				options,
				function (error, result) {
					imagesArr.push(result.secure_url);
					fs.unlinkSync(`uploads/${request.files[i].filename}`);
				},
			);
		}

		return response.status(200).json({
			images: imagesArr,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

/** Загрузка видео товара в Cloudinary (resource_type: video). */
export async function uploadProductVideos(request, response) {
	try {
		const files = request.files;
		if (!files?.length) {
			return response.status(400).json({
				message: 'Не переданы файлы видео',
				error: true,
				success: false,
			});
		}

		const urls = [];
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const result = await cloudinary.uploader.upload(file.path, {
				resource_type: 'video',
				folder: 'ibr-products-videos',
				use_filename: true,
				unique_filename: true,
				overwrite: false,
			});
			urls.push(result.secure_url);
			try {
				fs.unlinkSync(file.path);
			} catch {
				// ignore
			}
		}

		return response.status(200).json({
			videos: urls,
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
}

let bannerImage = [];
export async function uploadBannerImages(request, response) {
	try {
		bannerImage = [];

		const image = request.files;

		const options = {
			use_filename: true,
			unique_filename: false,
			overwrite: false,
		};

		for (let i = 0; i < image?.length; i++) {
			const img = await cloudinary.uploader.upload(
				image[i].path,
				options,
				function (error, result) {
					bannerImage.push(result.secure_url);
					fs.unlinkSync(`uploads/${request.files[i].filename}`);
				},
			);
		}

		return response.status(200).json({
			images: bannerImage,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

//create product
export async function createProduct(request, response) {
	try {
		const bodyImages =
			Array.isArray(request.body.images) && request.body.images.length > 0
				? request.body.images
				: imagesArr;
		const bodyBanners =
			Array.isArray(request.body.bannerimages) && request.body.bannerimages.length > 0
				? request.body.bannerimages
				: bannerImage.length > 0
					? bannerImage
					: bodyImages;

		if (!bodyImages || bodyImages.length === 0) {
			return response.status(400).json({
				message: 'Требуется минимум одно изображение: загрузите файлы или передайте images[]',
				error: true,
				success: false,
			});
		}

		const discount =
			request.body.discount !== undefined && request.body.discount !== null
				? Number(request.body.discount)
				: 0;

		const bodyVideos =
			Array.isArray(request.body.videos) && request.body.videos.length > 0
				? request.body.videos.filter((u) => typeof u === 'string' && String(u).trim())
				: [];

		const variantStock = normalizeVariantStockForSave(request.body.variantStock);

		let product = new ProductModel({
			name: request.body.name,
			description: request.body.description,
			images: bodyImages,
			bannerimages: bodyBanners && bodyBanners.length > 0 ? bodyBanners : bodyImages,
			videos: bodyVideos,
			bannerTitleName: request.body.bannerTitleName,
			isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner,
			brand: request.body.brand,
			price: request.body.price,
			oldPrice: request.body.oldPrice,
			catName: request.body.catName,
			category: request.body.category,
			catId: request.body.catId,
			subCatId: request.body.subCatId,
			subCat: request.body.subCat,
			thirdsubCat: request.body.thirdsubCat,
			thirdsubCatId: request.body.thirdsubCatId,
			countInStock: request.body.countInStock,
			rating: request.body.rating,
			isFeatured: request.body.isFeatured,
			discount,
			productRam: request.body.productRam,
			size: request.body.size,
			colors: request.body.colors,
			productWeight: request.body.productWeight,
			...(variantStock && variantStock.length > 0 ? { variantStock } : {}),
		});

		product = await product.save();

		if (!product) {
			return response.status(500).json({
				error: true,
				success: false,
				message: 'Product Not created',
			});
		}

		imagesArr = [];
		bannerImage = [];

		await appendAdminAudit(request.userId, 'product.create', {
			entityType: 'product',
			entityId: String(product._id),
			metadata: { name: product.name },
		});

		return response.status(200).json({
			message: 'Product Created successfully',
			error: false,
			success: true,
			product: product,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

//get all products
export async function getAllProducts(request, response) {
	try {
		// Валидация и нормализация параметров
		const pageNum = Math.max(1, parseInt(request.query.page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(request.query.limit) || 20));

		const {
			sortBy = 'createdAt',
			sortOrder = 'desc',
			minPrice,
			maxPrice,
			rating,
			inStock,
			category,
			categories,
			brands,
		} = request.query;

		// Построение query для фильтрации
		const query = {};

		// Фильтр по цене
		if (minPrice !== undefined || maxPrice !== undefined) {
			query.price = {};
			if (minPrice !== undefined && minPrice !== '') {
				query.price.$gte = parseFloat(minPrice);
			}
			if (maxPrice !== undefined && maxPrice !== '') {
				query.price.$lte = parseFloat(maxPrice);
			}
		}

		// Фильтр по рейтингу
		if (rating !== undefined && rating !== '' && parseFloat(rating) > 0) {
			query.rating = { $gte: parseFloat(rating) };
		}

		// Фильтр по наличию
		if (inStock !== undefined && inStock !== '') {
			const inStockBool = inStock === 'true' || inStock === '1' || inStock === true;
			if (inStockBool) {
				query.countInStock = { $gt: 0 };
			} else {
				query.countInStock = { $lte: 0 };
			}
		}

		// Фильтр по категориям (приоритет массиву categories над одиночной category)
		const categoryFilters = [];
		const categoriesArray = [];
		if (categories) {
			const arr = Array.isArray(categories) ? categories : [categories];
			for (const c of arr) {
				if (c != null && String(c).trim()) categoriesArray.push(c);
			}
		} else if (category != null && String(category).trim()) {
			categoriesArray.push(category);
		}

		let categoryChildrenByParent = null;
		const ensureCategoryTreeIndex = async () => {
			if (categoryChildrenByParent) return categoryChildrenByParent;
			const all = await CategoryModel.find({}).select('_id parentId').lean();
			categoryChildrenByParent = buildCategoryChildrenByParentId(all);
			return categoryChildrenByParent;
		};

		for (const raw of categoriesArray) {
			const catStr = String(raw).trim();
			if (mongoose.Types.ObjectId.isValid(catStr)) {
				const tree = await ensureCategoryTreeIndex();
				const subtree = collectDescendantCategoryIds(catStr, tree);
				const idStrings = [...subtree];
				const objectIds = idStrings.map((id) => new mongoose.Types.ObjectId(id));
				categoryFilters.push({
					$or: [
						{ catId: { $in: idStrings } },
						{ subCatId: { $in: idStrings } },
						{ thirdsubCatId: { $in: idStrings } },
						{ category: { $in: objectIds } },
					],
				});
				continue;
			}

			const escaped = catStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			categoryFilters.push(
				{ catName: new RegExp(escaped, 'i') },
				{ 'category.name': new RegExp(escaped, 'i') },
				{ 'category.slug': new RegExp(escaped, 'i') },
			);
			if (catStr.includes('-')) {
				const parts = catStr.split('-').map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
				if (parts.length > 1) {
					categoryFilters.push({ catName: new RegExp(parts.join('\\s+'), 'i') });
				}
			}
		}

		if (categoryFilters.length > 0) {
			query.$or = categoryFilters;
		}

		// Фильтр по брендам (обработка массива brands[]=value1&brands[]=value2)
		// Express автоматически парсит brands[] в массив, если их несколько
		if (brands) {
			const brandsArray = Array.isArray(brands) ? brands : [brands];
			const brandRegexes = brandsArray
				.filter((brand) => brand && String(brand).trim())
				.map((brand) => new RegExp(String(brand).trim(), 'i'));

			if (brandRegexes.length > 0) {
				query.brand = { $in: brandRegexes };
			}
		}

		// Построение объекта сортировки
		const sortObj = {};
		const sortField = sortBy || 'createdAt';
		const sortDirection = sortOrder === 'asc' ? 1 : -1;

		// Маппинг полей сортировки
		const sortFieldMap = {
			name: 'name',
			price: 'price',
			rating: 'rating',
			createdAt: 'createdAt',
		};

		const mappedSortField = sortFieldMap[sortField] || 'createdAt';
		sortObj[mappedSortField] = sortDirection;

		// Подсчет общего количества с учетом фильтров
		const total = await ProductModel.countDocuments(query);

		// Получение продуктов с пагинацией, фильтрацией и сортировкой
		const products = await ProductModel.find(query)
			.sort(sortObj)
			.skip((pageNum - 1) * limitNum)
			.limit(limitNum)
			.populate('category', 'name slug');

		if (!products) {
			return response.status(400).json({
				error: true,
				success: false,
			});
		}

		// Получение всех продуктов для totalProducts (без фильтров, только для совместимости)
		const totalProducts = await ProductModel.find().limit(1000);

		return response.status(200).json({
			error: false,
			success: true,
			products: products,
			total: total,
			page: pageNum,
			totalPages: Math.ceil(total / limitNum),
			totalCount: total,
			totalProducts: totalProducts,
		});
	} catch (error) {
		console.error('Ошибка в getAllProducts:', error);
		return response.status(500).json({
			message: error.message || 'Внутренняя ошибка сервера',
			error: true,
			success: false,
		});
	}
}

//get all products by category id
export async function getAllProductsByCatId(request, response) {
	try {
		const page = parseInt(request.query.page) || 1;
		const perPage = parseInt(request.query.perPage) || 10000;

		const totalPosts = await ProductModel.countDocuments();
		const totalPages = Math.ceil(totalPosts / perPage);

		if (page > totalPages) {
			return response.status(404).json({
				message: 'Page not found',
				success: false,
				error: true,
			});
		}

		const catParam = request.params.id;
		const allCats = await CategoryModel.find({}).select('_id parentId').lean();
		const tree = buildCategoryChildrenByParentId(allCats);
		const subtree =
			catParam && mongoose.Types.ObjectId.isValid(String(catParam))
				? collectDescendantCategoryIds(String(catParam), tree)
				: new Set([String(catParam)]);
		const idStrings = [...subtree];
		const objectIds = idStrings.map((id) => new mongoose.Types.ObjectId(id));

		const products = await ProductModel.find({
			$or: [
				{ catId: { $in: idStrings } },
				{ subCatId: { $in: idStrings } },
				{ thirdsubCatId: { $in: idStrings } },
				{ category: { $in: objectIds } },
			],
		})
			.populate('category')
			.skip((page - 1) * perPage)
			.limit(perPage)
			.exec();

		if (!products) {
			response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			products: products,
			totalPages: totalPages,
			page: page,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

//get all products by category name
export async function getAllProductsByCatName(request, response) {
	try {
		const page = parseInt(request.query.page) || 1;
		const perPage = parseInt(request.query.perPage) || 10000;

		const totalPosts = await ProductModel.countDocuments();
		const totalPages = Math.ceil(totalPosts / perPage);

		if (page > totalPages) {
			return response.status(404).json({
				message: 'Page not found',
				success: false,
				error: true,
			});
		}

		const products = await ProductModel.find({
			catName: request.query.catName,
		})
			.populate('category')
			.skip((page - 1) * perPage)
			.limit(perPage)
			.exec();

		if (!products) {
			response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			products: products,
			totalPages: totalPages,
			page: page,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

//get all products by sub category id
export async function getAllProductsBySubCatId(request, response) {
	try {
		const page = parseInt(request.query.page) || 1;
		const perPage = parseInt(request.query.perPage) || 10000;

		const totalPosts = await ProductModel.countDocuments();
		const totalPages = Math.ceil(totalPosts / perPage);

		if (page > totalPages) {
			return response.status(404).json({
				message: 'Page not found',
				success: false,
				error: true,
			});
		}

		const products = await ProductModel.find({
			subCatId: request.params.id,
		})
			.populate('category')
			.skip((page - 1) * perPage)
			.limit(perPage)
			.exec();

		if (!products) {
			response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			products: products,
			totalPages: totalPages,
			page: page,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

//get all products by sub category name
export async function getAllProductsBySubCatName(request, response) {
	try {
		const page = parseInt(request.query.page) || 1;
		const perPage = parseInt(request.query.perPage) || 10000;

		const totalPosts = await ProductModel.countDocuments();
		const totalPages = Math.ceil(totalPosts / perPage);

		if (page > totalPages) {
			return response.status(404).json({
				message: 'Page not found',
				success: false,
				error: true,
			});
		}

		const products = await ProductModel.find({
			subCat: request.query.subCat,
		})
			.populate('category')
			.skip((page - 1) * perPage)
			.limit(perPage)
			.exec();

		if (!products) {
			response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			products: products,
			totalPages: totalPages,
			page: page,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

//get all products by sub category id
export async function getAllProductsByThirdLavelCatId(request, response) {
	try {
		const page = parseInt(request.query.page) || 1;
		const perPage = parseInt(request.query.perPage) || 10000;

		const totalPosts = await ProductModel.countDocuments();
		const totalPages = Math.ceil(totalPosts / perPage);

		if (page > totalPages) {
			return response.status(404).json({
				message: 'Page not found',
				success: false,
				error: true,
			});
		}

		const products = await ProductModel.find({
			thirdsubCatId: request.params.id,
		})
			.populate('category')
			.skip((page - 1) * perPage)
			.limit(perPage)
			.exec();

		if (!products) {
			response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			products: products,
			totalPages: totalPages,
			page: page,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

//get all products by sub category name
export async function getAllProductsByThirdLavelCatName(request, response) {
	try {
		const page = parseInt(request.query.page) || 1;
		const perPage = parseInt(request.query.perPage) || 10000;

		const totalPosts = await ProductModel.countDocuments();
		const totalPages = Math.ceil(totalPosts / perPage);

		if (page > totalPages) {
			return response.status(404).json({
				message: 'Page not found',
				success: false,
				error: true,
			});
		}

		const products = await ProductModel.find({
			thirdsubCat: request.query.thirdsubCat,
		})
			.populate('category')
			.skip((page - 1) * perPage)
			.limit(perPage)
			.exec();

		if (!products) {
			response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			products: products,
			totalPages: totalPages,
			page: page,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

//get all products by price

export async function getAllProductsByPrice(request, response) {
	let productList = [];

	if (request.query.catId !== '' && request.query.catId !== undefined) {
		const productListArr = await ProductModel.find({
			catId: request.query.catId,
		}).populate('category');

		productList = productListArr;
	}

	if (request.query.subCatId !== '' && request.query.subCatId !== undefined) {
		const productListArr = await ProductModel.find({
			subCatId: request.query.subCatId,
		}).populate('category');

		productList = productListArr;
	}

	if (request.query.thirdsubCatId !== '' && request.query.thirdsubCatId !== undefined) {
		const productListArr = await ProductModel.find({
			thirdsubCatId: request.query.thirdsubCatId,
		}).populate('category');

		productList = productListArr;
	}

	const filteredProducts = productList.filter((product) => {
		if (request.query.minPrice && product.price < parseInt(+request.query.minPrice)) {
			return false;
		}
		if (request.query.maxPrice && product.price > parseInt(+request.query.maxPrice)) {
			return false;
		}
		return true;
	});

	return response.status(200).json({
		error: false,
		success: true,
		products: filteredProducts,
		totalPages: 0,
		page: 0,
	});
}

//get all products by rating
export async function getAllProductsByRating(request, response) {
	try {
		const page = parseInt(request.query.page) || 1;
		const perPage = parseInt(request.query.perPage) || 10000;

		const totalPosts = await ProductModel.countDocuments();
		const totalPages = Math.ceil(totalPosts / perPage);

		if (page > totalPages) {
			return response.status(404).json({
				message: 'Page not found',
				success: false,
				error: true,
			});
		}

		console.log(request.query.subCatId);

		let products = [];

		if (request.query.catId !== undefined) {
			products = await ProductModel.find({
				rating: request.query.rating,
				catId: request.query.catId,
			})
				.populate('category')
				.skip((page - 1) * perPage)
				.limit(perPage)
				.exec();
		}

		if (request.query.subCatId !== undefined) {
			products = await ProductModel.find({
				rating: request.query.rating,
				subCatId: request.query.subCatId,
			})
				.populate('category')
				.skip((page - 1) * perPage)
				.limit(perPage)
				.exec();
		}

		if (request.query.thirdsubCatId !== undefined) {
			products = await ProductModel.find({
				rating: request.query.rating,
				thirdsubCatId: request.query.thirdsubCatId,
			})
				.populate('category')
				.skip((page - 1) * perPage)
				.limit(perPage)
				.exec();
		}

		if (!products) {
			response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			products: products,
			totalPages: totalPages,
			page: page,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

//get all products count

export async function getProductsCount(request, response) {
	try {
		const productsCount = await ProductModel.countDocuments();

		if (!productsCount) {
			response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			productCount: productsCount,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function getPopularProducts(request, response) {
	try {
		const limitNum = Math.min(48, Math.max(1, parseInt(request.query.limit, 10) || 24));
		const products = await buildPopularProductsList(limitNum);
		return response.status(200).json({
			error: false,
			success: true,
			products,
		});
	} catch (error) {
		console.error('Ошибка в getPopularProducts:', error);
		return response.status(500).json({
			message: error.message || 'Внутренняя ошибка сервера',
			error: true,
			success: false,
		});
	}
}

export async function getSimilarProducts(request, response) {
	try {
		const productId = request.params.id;
		const limitNum = Math.min(48, Math.max(1, parseInt(request.query.limit, 10) || 12));
		if (!mongoose.Types.ObjectId.isValid(String(productId))) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Некорректный id товара',
			});
		}
		const product = await ProductModel.findById(productId).select('category catId').lean();
		if (!product) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'Товар не найден',
			});
		}

		const categoryRefId = product.category ? String(product.category) : null;
		const catIdStr =
			product.catId && String(product.catId).trim() ? String(product.catId).trim() : null;
		const anchorId =
			categoryRefId && mongoose.Types.ObjectId.isValid(categoryRefId)
				? categoryRefId
				: catIdStr && mongoose.Types.ObjectId.isValid(catIdStr)
					? catIdStr
					: null;

		const categoryScope = anchorId ? await buildProductCategoryScopeOr([anchorId]) : null;

		const baseFilter = {
			_id: { $ne: new mongoose.Types.ObjectId(String(productId)) },
			countInStock: { $gt: 0 },
		};
		const query = categoryScope ? { ...baseFilter, ...categoryScope } : baseFilter;

		let products = await ProductModel.find(query)
			.sort({ rating: -1, createdAt: -1 })
			.limit(limitNum)
			.populate('category', 'name slug');

		if (products.length < limitNum) {
			const exclude = new Set([String(productId), ...products.map((p) => String(p._id))]);
			const need = limitNum - products.length;
			const more = await fillProductsFromGlobalPopular({
				excludeIds: exclude,
				need,
			});
			products = products.concat(more);
		}

		return response.status(200).json({
			error: false,
			success: true,
			products,
		});
	} catch (error) {
		console.error('Ошибка в getSimilarProducts:', error);
		return response.status(500).json({
			message: error.message || 'Внутренняя ошибка сервера',
			error: true,
			success: false,
		});
	}
}

const VISUAL_SEARCH_SCAN_LIMIT = 300;
const VISUAL_SEARCH_RESULT_LIMIT = 24;
const VISUAL_HASH_CACHE_TTL_MS = 30 * 60 * 1000;
const VISUAL_MATCH_MAX_DISTANCE = 22;

/** @type {Map<string, { hash: string, productId: import('mongoose').Types.ObjectId }>} */
const visualProductHashCache = new Map();
let visualHashCacheBuiltAt = 0;

async function buildVisualProductHashCache() {
	if (
		visualProductHashCache.size > 0 &&
		Date.now() - visualHashCacheBuiltAt < VISUAL_HASH_CACHE_TTL_MS
	) {
		return visualProductHashCache;
	}

	visualProductHashCache.clear();

	const products = await ProductModel.find({ countInStock: { $gt: 0 } })
		.select('_id images rating')
		.sort({ rating: -1, createdAt: -1 })
		.limit(VISUAL_SEARCH_SCAN_LIMIT)
		.lean();

	for (const product of products) {
		const imageUrl = product.images?.[0];
		if (!imageUrl || typeof imageUrl !== 'string') continue;

		try {
			const hash = await computeDHashFromUrl(imageUrl);
			visualProductHashCache.set(String(product._id), {
				hash,
				productId: product._id,
			});
		} catch {
			// Пропускаем недоступные изображения
		}
	}

	visualHashCacheBuiltAt = Date.now();
	return visualProductHashCache;
}

export async function searchProductsByImage(request, response) {
	try {
		const file = request.file;
		if (!file?.buffer) {
			return response.status(400).json({
				success: false,
				error: true,
				message: 'Загрузите изображение в поле image',
			});
		}

		if (!file.mimetype?.startsWith('image/')) {
			return response.status(400).json({
				success: false,
				error: true,
				message: 'Допустимы только файлы изображений',
			});
		}

		const queryHash = await computeDHashFromBuffer(file.buffer);
		const cache = await buildVisualProductHashCache();

		if (cache.size === 0) {
			const fallback = await buildPopularProductsList(VISUAL_SEARCH_RESULT_LIMIT);
			return response.status(200).json({
				success: true,
				error: false,
				products: fallback,
				matchType: 'popular_fallback',
				message: 'Не удалось проиндексировать фото товаров — показаны популярные',
			});
		}

		const scored = [];
		for (const entry of cache.values()) {
			scored.push({
				productId: entry.productId,
				distance: hammingDistance(queryHash, entry.hash),
			});
		}

		scored.sort((a, b) => a.distance - b.distance);

		const strongMatches = scored
			.filter((item) => item.distance <= VISUAL_MATCH_MAX_DISTANCE)
			.slice(0, VISUAL_SEARCH_RESULT_LIMIT);

		const picked =
			strongMatches.length > 0 ? strongMatches : scored.slice(0, VISUAL_SEARCH_RESULT_LIMIT);

		const ids = picked.map((item) => item.productId);
		const products = await ProductModel.find({ _id: { $in: ids } })
			.populate('category', 'name slug')
			.lean();

		const order = new Map(ids.map((id, index) => [String(id), index]));
		products.sort((a, b) => (order.get(String(a._id)) ?? 0) - (order.get(String(b._id)) ?? 0));

		return response.status(200).json({
			success: true,
			error: false,
			products,
			matchType: strongMatches.length > 0 ? 'visual' : 'best_effort',
			scanned: cache.size,
		});
	} catch (error) {
		console.error('Ошибка в searchProductsByImage:', error);
		return response.status(500).json({
			success: false,
			error: true,
			message: error.message || 'Не удалось выполнить поиск по фото',
		});
	}
}

export async function getRecommendedForYou(request, response) {
	try {
		const limitNum = Math.min(48, Math.max(1, parseInt(request.query.limit, 10) || 16));
		const userId = request.userId;

		if (!userId) {
			const products = await buildPopularProductsList(limitNum);
			return response.status(200).json({
				error: false,
				success: true,
				products,
				fallback: 'popular',
			});
		}

		const uid = mongoose.Types.ObjectId.isValid(String(userId))
			? new mongoose.Types.ObjectId(String(userId))
			: userId;

		const orders = await OrderModel.find({ userId: uid })
			.sort({ createdAt: -1 })
			.limit(25)
			.select('products')
			.lean();

		const purchasedProductIds = [];
		const seen = new Set();
		for (const o of orders) {
			for (const line of o.products || []) {
				const pid = line.productId && String(line.productId).trim();
				if (pid && !seen.has(pid)) {
					seen.add(pid);
					purchasedProductIds.push(pid);
				}
			}
		}

		if (purchasedProductIds.length === 0) {
			const products = await buildPopularProductsList(limitNum);
			return response.status(200).json({
				error: false,
				success: true,
				products,
				fallback: 'popular',
			});
		}

		const objectIdsPurchased = purchasedProductIds
			.filter((id) => mongoose.Types.ObjectId.isValid(id))
			.map((id) => new mongoose.Types.ObjectId(id));

		// Иначе $nin: [] в MongoDB совпадает со всеми документами — утечка витрины
		if (objectIdsPurchased.length === 0) {
			const products = await buildPopularProductsList(limitNum);
			return response.status(200).json({
				error: false,
				success: true,
				products,
				fallback: 'popular',
			});
		}

		const boughtProducts = await ProductModel.find({ _id: { $in: objectIdsPurchased } })
			.select('category catId')
			.lean();

		const anchorIds = new Set();
		for (const p of boughtProducts) {
			if (p.category) anchorIds.add(String(p.category));
			const c = p.catId && String(p.catId).trim();
			if (c && mongoose.Types.ObjectId.isValid(c)) anchorIds.add(c);
		}

		const scopeOr = anchorIds.size > 0 ? await buildProductCategoryScopeOr(anchorIds) : null;

		const query = {
			_id: { $nin: objectIdsPurchased },
			countInStock: { $gt: 0 },
			...(scopeOr || {}),
		};

		let products = await ProductModel.find(query)
			.sort({ rating: -1, createdAt: -1 })
			.limit(limitNum)
			.populate('category', 'name slug');

		if (products.length < Math.min(6, limitNum)) {
			const exclude = new Set([...purchasedProductIds, ...products.map((p) => String(p._id))]);
			const need = limitNum - products.length;
			const more = await fillProductsFromGlobalPopular({
				excludeIds: exclude,
				need,
			});
			products = products.concat(more);
		}

		return response.status(200).json({
			error: false,
			success: true,
			products,
		});
	} catch (error) {
		console.error('Ошибка в getRecommendedForYou:', error);
		return response.status(500).json({
			message: error.message || 'Внутренняя ошибка сервера',
			error: true,
			success: false,
		});
	}
}

//get all features products
export async function getAllFeaturedProducts(request, response) {
	try {
		const products = await ProductModel.find({
			isFeatured: true,
		}).populate('category');

		if (!products) {
			response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			products: products,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

//get all features products have banners
export async function getAllProductsBanners(request, response) {
	try {
		const products = await ProductModel.find({
			isDisplayOnHomeBanner: true,
		}).populate('category');

		if (!products) {
			response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			products: products,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

//delete product
export async function deleteProduct(request, response) {
	const product = await ProductModel.findById(request.params.id).populate('category');

	if (!product) {
		return response.status(404).json({
			message: 'Product Not found',
			error: true,
			success: false,
		});
	}

	const images = product.images;

	let img = '';
	for (img of images) {
		const imgUrl = img;
		const urlArr = imgUrl.split('/');
		const image = urlArr[urlArr.length - 1];

		const imageName = image.split('.')[0];

		if (imageName) {
			cloudinary.uploader.destroy(imageName, (error, result) => {
				// console.log(error, result);
			});
		}
	}

	const deletedProduct = await ProductModel.findByIdAndDelete(request.params.id);

	if (!deletedProduct) {
		return response.status(404).json({
			message: 'Product not deleted!',
			success: false,
			error: true,
		});
	}

	await appendAdminAudit(request.userId, 'product.delete', {
		entityType: 'product',
		entityId: String(request.params.id),
	});

	return response.status(200).json({
		success: true,
		error: false,
		message: 'Product Deleted!',
	});
}

//delete multiple products
export async function deleteMultipleProduct(request, response) {
	const { ids } = request.body;

	if (!ids || !Array.isArray(ids)) {
		return response.status(400).json({ error: true, success: false, message: 'Invalid input' });
	}

	for (let i = 0; i < ids?.length; i++) {
		const product = await ProductModel.findById(ids[i]);
		if (!product) continue;

		const images = product.images;

		let img = '';
		for (img of images) {
			const imgUrl = img;
			const urlArr = imgUrl.split('/');
			const image = urlArr[urlArr.length - 1];

			const imageName = image.split('.')[0];

			if (imageName) {
				cloudinary.uploader.destroy(imageName, (error, result) => {
					// console.log(error, result);
				});
			}
		}
	}

	try {
		await ProductModel.deleteMany({ _id: { $in: ids } });
		await appendAdminAudit(request.userId, 'product.delete_many', {
			entityType: 'product',
			entityId: 'bulk',
			metadata: { count: ids.length },
		});
		return response.status(200).json({
			message: 'Product delete successfully',
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
}

/** Массовое обновление товаров (сейчас — только isFeatured). Только ADMIN. */
export async function bulkUpdateProducts(request, response) {
	try {
		const { ids, isFeatured } = request.body || {};
		if (!Array.isArray(ids) || ids.length === 0 || typeof isFeatured !== 'boolean') {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid input: ids[] and isFeatured are required',
			});
		}

		const validIds = ids.filter((id) => mongoose.isValidObjectId(id));
		if (!validIds.length) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'No valid product ids',
			});
		}

		const result = await ProductModel.updateMany(
			{ _id: { $in: validIds } },
			{ $set: { isFeatured } },
		);

		await appendAdminAudit(request.userId, 'product.bulk_update', {
			entityType: 'product',
			entityId: 'bulk',
			metadata: { count: validIds.length, isFeatured },
		});

		return response.status(200).json({
			success: true,
			error: false,
			modifiedCount: result.modifiedCount ?? 0,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

//get single product
export async function getProduct(request, response) {
	try {
		const product = await ProductModel.findById(request.params.id).populate('category');

		if (!product) {
			return response.status(404).json({
				message: 'The product is not found',
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			product: product,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

//delete images
export async function removeImageFromCloudinary(request, response) {
	const imgUrl = request.query.img;

	const urlArr = imgUrl.split('/');
	const image = urlArr[urlArr.length - 1];

	const imageName = image.split('.')[0];

	if (imageName) {
		const res = await cloudinary.uploader.destroy(imageName, (error, result) => {
			// console.log(error, res)
		});

		if (res) {
			response.status(200).send(res);
		}
	}
}

//updated product
export async function updateProduct(request, response) {
	try {
		const doc = await ProductModel.findById(request.params.id);
		if (!doc) {
			return response.status(404).json({
				message: 'the product can not be updated!',
				status: false,
			});
		}

		const b = request.body;
		const keys = [
			'name',
			'subCat',
			'description',
			'bannerTitleName',
			'isDisplayOnHomeBanner',
			'brand',
			'price',
			'oldPrice',
			'catId',
			'catName',
			'subCatId',
			'category',
			'thirdsubCat',
			'thirdsubCatId',
			'countInStock',
			'rating',
			'isFeatured',
			'discount',
			'productRam',
			'size',
			'colors',
			'productWeight',
		];
		for (const key of keys) {
			if (b[key] !== undefined) doc[key] = b[key];
		}
		if (Array.isArray(b.images)) doc.images = b.images;
		if (Array.isArray(b.bannerimages)) doc.bannerimages = b.bannerimages;
		if (Array.isArray(b.videos)) {
			doc.videos = b.videos.filter((u) => typeof u === 'string' && String(u).trim());
		}
		if (Array.isArray(b.variantStock)) {
			const vs = normalizeVariantStockForSave(b.variantStock);
			doc.variantStock = vs && vs.length > 0 ? vs : [];
		}

		await doc.save();
		imagesArr = [];

		await appendAdminAudit(request.userId, 'product.update', {
			entityType: 'product',
			entityId: String(doc._id),
		});

		return response.status(200).json({
			message: 'The product is updated',
			error: false,
			success: true,
			product: doc.toObject(),
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function createProductRAMS(request, response) {
	try {
		let productRAMS = new ProductRAMSModel({
			name: request.body.name,
		});

		productRAMS = await productRAMS.save();

		if (!productRAMS) {
			response.status(500).json({
				error: true,
				success: false,
				message: 'Product RAMS Not created',
			});
		}

		return response.status(200).json({
			message: 'Product RAMS Created successfully',
			error: false,
			success: true,
			product: productRAMS,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function deleteProductRAMS(request, response) {
	const productRams = await ProductRAMSModel.findById(request.params.id);

	if (!productRams) {
		return response.status(404).json({
			message: 'Item Not found',
			error: true,
			success: false,
		});
	}

	const deletedProductRams = await ProductRAMSModel.findByIdAndDelete(request.params.id);

	if (!deletedProductRams) {
		response.status(404).json({
			message: 'Item not deleted!',
			success: false,
			error: true,
		});
	}

	return response.status(200).json({
		success: true,
		error: false,
		message: 'Product Ram Deleted!',
	});
}

export async function updateProductRam(request, response) {
	try {
		const productRam = await ProductRAMSModel.findByIdAndUpdate(
			request.params.id,
			{
				name: request.body.name,
			},
			{ new: true },
		);

		if (!productRam) {
			return response.status(404).json({
				message: 'the product Ram can not be updated!',
				status: false,
			});
		}

		return response.status(200).json({
			message: 'The product Ram is updated',
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
}

export async function getProductRams(request, response) {
	try {
		const productRam = await ProductRAMSModel.find();

		if (!productRam) {
			return response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			data: productRam,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function getProductRamsById(request, response) {
	try {
		const productRam = await ProductRAMSModel.findById(request.params.id);

		if (!productRam) {
			return response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			data: productRam,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function createProductWEIGHT(request, response) {
	try {
		let productWeight = new ProductWEIGHTModel({
			name: request.body.name,
		});

		productWeight = await productWeight.save();

		if (!productWeight) {
			response.status(500).json({
				error: true,
				success: false,
				message: 'Product WEIGHT Not created',
			});
		}

		return response.status(200).json({
			message: 'Product WEIGHT Created successfully',
			error: false,
			success: true,
			product: productWeight,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function deleteProductWEIGHT(request, response) {
	const productWeight = await ProductWEIGHTModel.findById(request.params.id);

	if (!productWeight) {
		return response.status(404).json({
			message: 'Item Not found',
			error: true,
			success: false,
		});
	}

	const deletedProductWeight = await ProductWEIGHTModel.findByIdAndDelete(request.params.id);

	if (!deletedProductWeight) {
		response.status(404).json({
			message: 'Item not deleted!',
			success: false,
			error: true,
		});
	}

	return response.status(200).json({
		success: true,
		error: false,
		message: 'Product Weight Deleted!',
	});
}

export async function updateProductWeight(request, response) {
	try {
		const productWeight = await ProductWEIGHTModel.findByIdAndUpdate(
			request.params.id,
			{
				name: request.body.name,
			},
			{ new: true },
		);

		if (!productWeight) {
			return response.status(404).json({
				message: 'the product weight can not be updated!',
				status: false,
			});
		}

		return response.status(200).json({
			message: 'The product weight is updated',
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
}

export async function getProductWeight(request, response) {
	try {
		const productWeight = await ProductWEIGHTModel.find();

		if (!productWeight) {
			return response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			data: productWeight,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function getProductWeightById(request, response) {
	try {
		const productWeight = await ProductWEIGHTModel.findById(request.params.id);

		if (!productWeight) {
			return response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			data: productWeight,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function createProductSize(request, response) {
	try {
		let productSize = new ProductSIZEModel({
			name: request.body.name,
		});

		productSize = await productSize.save();

		if (!productSize) {
			response.status(500).json({
				error: true,
				success: false,
				message: 'Product size Not created',
			});
		}

		return response.status(200).json({
			message: 'Product size Created successfully',
			error: false,
			success: true,
			product: productSize,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function deleteProductSize(request, response) {
	const productSize = await ProductSIZEModel.findById(request.params.id);

	if (!productSize) {
		return response.status(404).json({
			message: 'Item Not found',
			error: true,
			success: false,
		});
	}

	const deletedProductSize = await ProductSIZEModel.findByIdAndDelete(request.params.id);

	if (!deletedProductSize) {
		response.status(404).json({
			message: 'Item not deleted!',
			success: false,
			error: true,
		});
	}

	return response.status(200).json({
		success: true,
		error: false,
		message: 'Product size Deleted!',
	});
}

export async function updateProductSize(request, response) {
	try {
		const productSize = await ProductSIZEModel.findByIdAndUpdate(
			request.params.id,
			{
				name: request.body.name,
			},
			{ new: true },
		);

		if (!productSize) {
			return response.status(404).json({
				message: 'the product size can not be updated!',
				status: false,
			});
		}

		return response.status(200).json({
			message: 'The product size is updated',
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
}

export async function getProductSize(request, response) {
	try {
		const productSize = await ProductSIZEModel.find();

		if (!productSize) {
			return response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			data: productSize,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function getProductSizeById(request, response) {
	try {
		const productSize = await ProductSIZEModel.findById(request.params.id);

		if (!productSize) {
			return response.status(500).json({
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			error: false,
			success: true,
			data: productSize,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function filters(request, response) {
	const { catId, subCatId, thirdsubCatId, minPrice, maxPrice, rating, page, limit } = request.body;

	const filters = {};

	if (catId?.length) {
		filters.catId = { $in: catId };
	}

	if (subCatId?.length) {
		filters.subCatId = { $in: subCatId };
	}

	if (thirdsubCatId?.length) {
		filters.thirdsubCatId = { $in: thirdsubCatId };
	}

	if (minPrice || maxPrice) {
		filters.price = { $gte: +minPrice || 0, $lte: +maxPrice || Infinity };
	}

	if (rating?.length) {
		filters.rating = { $in: rating };
	}

	try {
		const products = await ProductModel.find(filters)
			.populate('category')
			.skip((page - 1) * limit)
			.limit(parseInt(limit));

		const total = await ProductModel.countDocuments(filters);

		return response.status(200).json({
			error: false,
			success: true,
			products: products,
			total: total,
			page: parseInt(page),
			totalPages: Math.ceil(total / limit),
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

// Sort function
const sortItems = (products, sortBy, order) => {
	return products.sort((a, b) => {
		if (sortBy === 'name') {
			return order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
		}
		if (sortBy === 'price') {
			return order === 'asc' ? a.price - b.price : b.price - a.price;
		}
		return 0; // Default
	});
};

export async function sortBy(request, response) {
	const { products, sortBy, order } = request.body;
	const sortedItems = sortItems(products ? [...products.products] : [], sortBy, order);
	return response.status(200).json({
		error: false,
		success: true,
		products: sortedItems,
		totalPages: 0,
		page: 0,
	});
}

export async function searchProductController(request, response) {
	try {
		const { query, page, limit, categories, category } = request.body;

		if (!query) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Query is required',
			});
		}

		const trimmed = String(query).trim();
		const pageNum = Math.max(1, parseInt(page, 10) || 1);
		const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
		const skip = (pageNum - 1) * limitNum;
		const orConditions = buildProductSearchOrConditions(trimmed);

		const categoriesArray = [];
		if (categories) {
			const arr = Array.isArray(categories) ? categories : [categories];
			for (const c of arr) {
				if (c != null && String(c).trim()) categoriesArray.push(String(c).trim());
			}
		} else if (category != null && String(category).trim()) {
			categoriesArray.push(String(category).trim());
		}

		const categoryScope =
			categoriesArray.length > 0 ? await buildProductCategoryScopeOr(categoriesArray) : null;

		if (orConditions.length === 0 && !categoryScope) {
			return response.status(200).json({
				error: false,
				success: true,
				products: [],
				total: 0,
				page: pageNum,
				totalPages: 0,
			});
		}

		const searchFilter =
			orConditions.length > 0 && categoryScope
				? { $and: [{ $or: orConditions }, categoryScope] }
				: categoryScope || { $or: orConditions };

		const [products, total] = await Promise.all([
			ProductModel.find(searchFilter)
				.populate('category')
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limitNum),
			ProductModel.countDocuments(searchFilter),
		]);

		const totalPages = total === 0 ? 0 : Math.ceil(total / limitNum);

		return response.status(200).json({
			error: false,
			success: true,
			products,
			total,
			page: pageNum,
			totalPages,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

// Autocomplete search - оптимизированный поиск для автозаполнения
export async function autocompleteSearchController(request, response) {
	try {
		// Получаем параметры из query string (GET запрос)
		const query = (request.query.q || request.query.query || '').trim();
		const limit = Math.min(50, Math.max(1, parseInt(request.query.limit) || 5));

		// Если запрос пустой, возвращаем пустой результат
		if (!query || query.length === 0) {
			return response.status(200).json({
				error: false,
				success: true,
				products: [],
				suggestions: [],
			});
		}

		// Оптимизированный поиск: только нужные поля, ограничение результатов (+ артикул / ObjectId)
		const products = await ProductModel.find({
			$or: buildProductSearchOrConditions(query),
		})
			.select('_id name catName category brand') // Только нужные поля для производительности
			.populate('category', 'name slug') // Только нужные поля категории
			.limit(limit)
			.lean(); // Используем lean() для лучшей производительности

		// Форматируем результат для автокомплита
		const suggestions = products.map((product) => ({
			id: product._id?.toString() || '',
			title: product.name || '',
			category: product.catName || product.category?.name || '',
		}));

		return response.status(200).json({
			error: false,
			success: true,
			products: products,
			suggestions: suggestions,
		});
	} catch (error) {
		console.error('Ошибка в autocompleteSearchController:', error);
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}
