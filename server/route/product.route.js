import { Router } from 'express';
import {
	autocompleteSearchController,
	bulkUpdateProducts,
	createProduct,
	createProductRAMS,
	createProductSize,
	createProductWEIGHT,
	deleteMultipleProduct,
	deleteProduct,
	deleteProductRAMS,
	deleteProductSize,
	deleteProductWEIGHT,
	filters,
	getAllFeaturedProducts,
	getAllProducts,
	getAllProductsBanners,
	getPopularProducts,
	getRecommendedForYou,
	getSimilarProducts,
	getAllProductsByCatId,
	getAllProductsByCatName,
	getAllProductsByPrice,
	getAllProductsByRating,
	getAllProductsBySubCatId,
	getAllProductsBySubCatName,
	getAllProductsByThirdLavelCatId,
	getProduct,
	getProductRams,
	getProductRamsById,
	getProductsCount,
	getProductSize,
	getProductSizeById,
	getProductWeight,
	getProductWeightById,
	searchProductController,
	searchProductsByImage,
	sortBy,
	updateProduct,
	updateProductRam,
	updateProductSize,
	updateProductWeight,
	uploadBannerImages,
	uploadImages,
	uploadProductVideos,
} from '../controllers/product.controller.js';
import auth from '../middlewares/auth.js';
import optionalAuth from '../middlewares/optionalAuth.js';
import upload from '../middlewares/multer.js';
import multer from 'multer';
import { uploadVideo } from '../middlewares/multer-video.js';

const uploadImageMemory = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
});
import requireAdmin from '../middlewares/requireAdmin.js';
import requirePermission from '../middlewares/requirePermission.js';
import { PERM } from '../utils/permissions.js';
import { validateBody } from '../middlewares/validateBody.js';
import { productCreateSchema, productUpdateSchema } from '../validation/schemas.js';

import { removeImageFromCloudinary } from '../controllers/category.controller.js';

const productRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product management and retrieval
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductRAMS:
 *       type: object
 *       required: [name]
 *       properties:
 *         _id: { type: string, example: "64a1b2c3d4e5f6a7b8c9d0e1" }
 *         name: { type: string, example: "8GB" }
 *         dateCreated: { type: string, format: date-time }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     ProductWeight:
 *       type: object
 *       required: [name]
 *       properties:
 *         _id: { type: string, example: "64a1b2c3d4e5f6a7b8c9d0e1" }
 *         name: { type: string, example: "200g" }
 *         dateCreated: { type: string, format: date-time }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     ProductSize:
 *       type: object
 *       required: [name]
 *       properties:
 *         _id: { type: string, example: "64a1b2c3d4e5f6a7b8c9d0e1" }
 *         name: { type: string, example: "XL" }
 *         dateCreated: { type: string, format: date-time }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */

/**
 * @swagger
 * /api/product/uploadImages:
 *   post:
 *     summary: Upload product images
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 */
productRouter.post(
	'/uploadImages',
	auth,
	requirePermission(PERM.CATALOG),
	upload.array('images'),
	uploadImages,
);

productRouter.post(
	'/uploadVideos',
	auth,
	requirePermission(PERM.CATALOG),
	uploadVideo.array('videos', 3),
	uploadProductVideos,
);

/**
 * @swagger
 * /api/product/uploadBannerImages:
 *   post:
 *     summary: Upload product banner images
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               bannerimages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Banner images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 */
productRouter.post(
	'/uploadBannerImages',
	auth,
	requirePermission(PERM.CATALOG),
	upload.array('bannerimages'),
	uploadBannerImages,
);

/**
 * @swagger
 * /api/product/create:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
productRouter.post(
	'/create',
	auth,
	requirePermission(PERM.CATALOG),
	validateBody(productCreateSchema),
	createProduct,
);

/**
 * @swagger
 * /api/product/getAllProducts:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.get('/getAllProducts', getAllProducts);

/**
 * @swagger
 * /api/product/getAllProductsBanners:
 *   get:
 *     summary: Get all product banners
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all product banners
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: urlToBannerImage
 */
productRouter.get('/getAllProductsBanners', getAllProductsBanners);

/**
 * @swagger
 * /api/product/getAllProductsByCatId/{id}:
 *   get:
 *     summary: Get products by category ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Products by category ID
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.get('/getAllProductsByCatId/:id', getAllProductsByCatId);

/**
 * @swagger
 * /api/product/getAllProductsByCatName:
 *   get:
 *     summary: Get products by category name
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: catName
 *         schema:
 *           type: string
 *         required: true
 *         description: Category name
 *     responses:
 *       200:
 *         description: Products by category name
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.get('/getAllProductsByCatName', getAllProductsByCatName);

/**
 * @swagger
 * /api/product/getAllProductsBySubCatId/{id}:
 *   get:
 *     summary: Get products by subcategory ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Subcategory ID
 *     responses:
 *       200:
 *         description: Products by subcategory ID
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.get('/getAllProductsBySubCatId/:id', getAllProductsBySubCatId);

/**
 * @swagger
 * /api/product/getAllProductsBySubCatName:
 *   get:
 *     summary: Get products by subcategory name
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: subCat
 *         schema:
 *           type: string
 *         required: true
 *         description: Subcategory name
 *     responses:
 *       200:
 *         description: Products by subcategory name
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.get('/getAllProductsBySubCatName', getAllProductsBySubCatName);

/**
 * @swagger
 * /api/product/getAllProductsByThirdLavelCat/{id}:
 *   get:
 *     summary: Get products by third-level category ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Third-level category ID
 *     responses:
 *       200:
 *         description: Products by third-level category ID
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.get('/getAllProductsByThirdLavelCat/:id', getAllProductsByThirdLavelCatId);

/**
 * @swagger
 * /api/product/getAllProductsByThirdLavelCatName:
 *   get:
 *     summary: Get products by third-level category name
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: thirdsubCat
 *         schema:
 *           type: string
 *         required: true
 *         description: Third-level category name
 *     responses:
 *       200:
 *         description: Products by third-level category name
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.get('/getAllProductsByThirdLavelCatName', getAllProductsBySubCatName);

/**
 * @swagger
 * /api/product/getAllProductsByPrice:
 *   get:
 *     summary: Get products by price
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: price
 *         schema:
 *           type: number
 *         required: false
 *         description: Price range filter
 *     responses:
 *       200:
 *         description: Products by price range
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.get('/getAllProductsByPrice', getAllProductsByPrice);

/**
 * @swagger
 * /api/product/getAllProductsByRating:
 *   get:
 *     summary: Get products by rating
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *         required: false
 *         description: Filter by rating
 *     responses:
 *       200:
 *         description: Products by rating
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.get('/getAllProductsByRating', getAllProductsByRating);

/**
 * @swagger
 * /api/product/getAllProductsCount:
 *   get:
 *     summary: Get products count
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Total products count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productCount:
 *                   type: integer
 */
productRouter.get('/getAllProductsCount', getProductsCount);

/**
 * @swagger
 * /api/product/getAllFeaturedProducts:
 *   get:
 *     summary: Get all featured products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Featured products list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.get('/getAllFeaturedProducts', getAllFeaturedProducts);

productRouter.get('/getPopularProducts', getPopularProducts);

productRouter.get('/getRecommendedForYou', optionalAuth, getRecommendedForYou);

/**
 * @swagger
 * /api/product/deleteMultiple:
 *   delete:
 *     summary: Delete multiple products
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Products deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deletedCount:
 *                   type: integer
 */
productRouter.delete(
	'/deleteMultiple',
	auth,
	requireAdmin,
	deleteMultipleProduct,
);

/**
 * @swagger
 * /api/product/bulk:
 *   patch:
 *     summary: Массовое обновление товаров (isFeatured)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids, isFeatured]
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               isFeatured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Товары обновлены
 */
productRouter.patch('/bulk', auth, requirePermission(PERM.CATALOG), bulkUpdateProducts);

/**
 * @swagger
 * /api/product/deteleImage:
 *   delete:
 *     summary: Delete image from Cloudinary
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               public_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
productRouter.delete(
	'/deteleImage',
	auth,
	requirePermission(PERM.CATALOG),
	removeImageFromCloudinary,
);

/**
 * @swagger
 * /api/product/updateProduct/{id}:
 *   put:
 *     summary: Update an existing product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
productRouter.put(
	'/updateProduct/:id',
	auth,
	requirePermission(PERM.CATALOG),
	validateBody(productUpdateSchema),
	updateProduct,
);

// ✅ Роуты поиска должны быть ДО динамического /:id

/**
 * @swagger
 * /api/product/filters:
 *   post:
 *     summary: Filter products
 *     tags: [Products]
 *     requestBody:
 *       description: Filter options
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: {}
 *     responses:
 *       200:
 *         description: Filtered products list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.post('/filters', filters);

/**
 * @swagger
 * /api/product/sortBy:
 *   post:
 *     summary: Sort products
 *     tags: [Products]
 *     requestBody:
 *       description: Sort options
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: {}
 *     responses:
 *       200:
 *         description: Sorted products list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.post('/sortBy', sortBy);

/**
 * @swagger
 * /api/product/search/get:
 *   post:
 *     summary: Search products
 *     tags: [Products]
 *     requestBody:
 *       description: Search query
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: {}
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.post('/search/get', searchProductController);

/**
 * @swagger
 * /api/product/search/autocomplete:
 *   get:
 *     summary: Autocomplete product search
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: false
 *         description: Query string for autocompletion
 *     responses:
 *       200:
 *         description: Autocomplete suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 */
productRouter.get('/search/autocomplete', autocompleteSearchController);
productRouter.post('/search/by-image', uploadImageMemory.single('image'), searchProductsByImage);

// ✅ Динамические роуты в конце

/**
 * @swagger
 * /api/product/{id}:
 *   delete:
 *     summary: Delete product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
productRouter.delete('/:id', auth, requireAdmin, deleteProduct);

/**
 * @swagger
 * /api/product/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Single product data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
productRouter.get('/:id/similar', getSimilarProducts);

productRouter.get('/:id', getProduct);

/**
 * @swagger
 * /api/product/productRAMS/create:
 *   post:
 *     summary: Create product RAM entry
 *     tags: [Products, ProductRAMS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductRAMS'
 *     responses:
 *       200:
 *         description: RAM created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductRAMS'
 */
productRouter.post('/productRAMS/create', auth, requirePermission(PERM.CATALOG), createProductRAMS);

/**
 * @swagger
 * /api/product/productRAMS/{id}:
 *   delete:
 *     summary: Delete product RAM by ID
 *     tags: [Products, ProductRAMS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: RAM ID
 *     responses:
 *       200:
 *         description: RAM deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
productRouter.delete('/productRAMS/:id', auth, requirePermission(PERM.CATALOG), deleteProductRAMS);

/**
 * @swagger
 * /api/product/productRAMS/{id}:
 *   put:
 *     summary: Update product RAM by ID
 *     tags: [Products, ProductRAMS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: RAM ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductRAMS'
 *     responses:
 *       200:
 *         description: RAM updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductRAMS'
 */
productRouter.put('/productRAMS/:id', auth, requirePermission(PERM.CATALOG), updateProductRam);

/**
 * @swagger
 * /api/product/productRAMS/get:
 *   get:
 *     summary: Get all product RAMs
 *     tags: [Products, ProductRAMS]
 *     responses:
 *       200:
 *         description: List of product RAMs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductRAMS'
 */
productRouter.get('/productRAMS/get', getProductRams);

/**
 * @swagger
 * /api/product/productRAMS/{id}:
 *   get:
 *     summary: Get product RAM by ID
 *     tags: [Products, ProductRAMS]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: RAM ID
 *     responses:
 *       200:
 *         description: RAM found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductRAMS'
 */
productRouter.get('/productRAMS/:id', getProductRamsById);

/**
 * @swagger
 * /api/product/productWeight/create:
 *   post:
 *     summary: Create product weight entry
 *     tags: [Products, ProductWeight]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductWeight'
 *     responses:
 *       200:
 *         description: Weight created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductWeight'
 */
productRouter.post(
	'/productWeight/create',
	auth,
	requirePermission(PERM.CATALOG),
	createProductWEIGHT,
);

/**
 * @swagger
 * /api/product/productWeight/{id}:
 *   delete:
 *     summary: Delete product weight by ID
 *     tags: [Products, ProductWeight]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Weight ID
 *     responses:
 *       200:
 *         description: Weight deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
productRouter.delete(
	'/productWeight/:id',
	auth,
	requirePermission(PERM.CATALOG),
	deleteProductWEIGHT,
);

/**
 * @swagger
 * /api/product/productWeight/{id}:
 *   put:
 *     summary: Update product weight by ID
 *     tags: [Products, ProductWeight]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Weight ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductWeight'
 *     responses:
 *       200:
 *         description: Weight updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductWeight'
 */
productRouter.put('/productWeight/:id', auth, requirePermission(PERM.CATALOG), updateProductWeight);

/**
 * @swagger
 * /api/product/productWeight/get:
 *   get:
 *     summary: Get all product weights
 *     tags: [Products, ProductWeight]
 *     responses:
 *       200:
 *         description: List of product weights
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductWeight'
 */
productRouter.get('/productWeight/get', getProductWeight);

/**
 * @swagger
 * /api/product/productWeight/{id}:
 *   get:
 *     summary: Get product weight by ID
 *     tags: [Products, ProductWeight]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Weight ID
 *     responses:
 *       200:
 *         description: Weight found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductWeight'
 */
productRouter.get('/productWeight/:id', getProductWeightById);

/**
 * @swagger
 * /api/product/productSize/create:
 *   post:
 *     summary: Create product size entry
 *     tags: [Products, ProductSize]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductSize'
 *     responses:
 *       200:
 *         description: Size created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductSize'
 */
productRouter.post('/productSize/create', auth, requirePermission(PERM.CATALOG), createProductSize);

/**
 * @swagger
 * /api/product/productSize/{id}:
 *   delete:
 *     summary: Delete product size by ID
 *     tags: [Products, ProductSize]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Size ID
 *     responses:
 *       200:
 *         description: Size deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
productRouter.delete('/productSize/:id', auth, requirePermission(PERM.CATALOG), deleteProductSize);

/**
 * @swagger
 * /api/product/productSize/{id}:
 *   put:
 *     summary: Update product size by ID
 *     tags: [Products, ProductSize]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Size ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductSize'
 *     responses:
 *       200:
 *         description: Size updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductSize'
 */
productRouter.put('/productSize/:id', auth, requirePermission(PERM.CATALOG), updateProductSize);

/**
 * @swagger
 * /api/product/productSize/get:
 *   get:
 *     summary: Get all product sizes
 *     tags: [Products, ProductSize]
 *     responses:
 *       200:
 *         description: List of product sizes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductSize'
 */
productRouter.get('/productSize/get', getProductSize);

/**
 * @swagger
 * /api/product/productSize/{id}:
 *   get:
 *     summary: Get product size by ID
 *     tags: [Products, ProductSize]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Size ID
 *     responses:
 *       200:
 *         description: Size found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductSize'
 */
productRouter.get('/productSize/:id', getProductSizeById);

export default productRouter;
