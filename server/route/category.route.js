import { Router } from 'express';

import {
	createCategory,
	deleteCategory,
	getCategories,
	getCategoriesCount,
	getCategory,
	getSubCategoriesCount,
	removeImageFromCloudinary,
	updatedCategory,
	uploadImages,
} from '../controllers/category.controller.js';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import requirePermission from '../middlewares/requirePermission.js';
import { PERM } from '../utils/permissions.js';
import { validateBody } from '../middlewares/validateBody.js';
import { categoryCreateSchema, categoryUpdateSchema } from '../validation/schemas.js';

const categoryRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: Категории товаров и подкатегории
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - images
 *       properties:
 *         _id:
 *           type: string
 *           example: 664d687c9ab241f0a2ddf170
 *         name:
 *           type: string
 *           example: Техника
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             example: https://res.cloudinary.com/....jpg
 *         parentId:
 *           type: string
 *           nullable: true
 *           example: 664d687c9ab241f0a2ddf171
 *         parentCatName:
 *           type: string
 *           nullable: true
 *           example: Электроника
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/category/uploadImages:
 *   post:
 *     summary: Загрузить изображения категорий через Cloudinary
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
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
 *         description: Изображения успешно загружены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Ошибка загрузки изображений
 *       401:
 *         description: Не авторизован
 */

categoryRouter.post('/uploadImages', auth, requirePermission(PERM.CATALOG), upload.array('images'), uploadImages);

/**
 * @swagger
 * /api/category/create:
 *   post:
 *     summary: Создать новую категорию
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Электроника
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               parentId:
 *                 type: string
 *                 nullable: true
 *                 example: 664d687c9ab241f0a2ddf170
 *               parentCatName:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Категория успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Неверные данные категории
 *       401:
 *         description: Не авторизован
 */
categoryRouter.post(
	'/create',
	auth,
	requirePermission(PERM.CATALOG),
	validateBody(categoryCreateSchema),
	createCategory,
);

/**
 * @swagger
 * /api/category:
 *   get:
 *     summary: Получить древовидную структуру всех категорий
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Список категорий в древовидном формате
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Ошибка получения категорий
 */
categoryRouter.get('/', getCategories);

/**
 * @swagger
 * /api/category/get/count:
 *   get:
 *     summary: Получить количество корневых (без родителя) категорий
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Количество корневых категорий
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categoryCount:
 *                   type: number
 *       500:
 *         description: Ошибка получения количества категорий
 */
categoryRouter.get('/get/count', getCategoriesCount);

/**
 * @swagger
 * /api/category/get/count/subCat:
 *   get:
 *     summary: Получить количество подкатегорий (имеют parentId)
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Количество подкатегорий
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subCategoryCount:
 *                   type: number
 *       500:
 *         description: Ошибка получения количества подкатегорий
 */
categoryRouter.get('/get/count/subCat', getSubCategoriesCount);

/**
 * @swagger
 * /api/category/{id}:
 *   get:
 *     summary: Получить категорию по ID
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Категория найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Категория не найдена
 *       500:
 *         description: Ошибка получения категории
 */
categoryRouter.get('/:id', getCategory);

/**
 * @swagger
 * /api/category/deteleImage:
 *   delete:
 *     summary: Удалить изображение категории с Cloudinary
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: img
 *         required: true
 *         schema:
 *           type: string
 *         description: URL удаляемого изображения
 *     responses:
 *       200:
 *         description: Изображение успешно удалено
 *       400:
 *         description: Не указан или неверный URL изображения
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка удаления
 */
categoryRouter.delete('/deteleImage', auth, requirePermission(PERM.CATALOG), removeImageFromCloudinary);

/**
 * @swagger
 * /api/category/{id}:
 *   delete:
 *     summary: Удалить категорию и все подкатегории (и изображения из Cloudinary)
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Категория и все подкатегории удалены
 *       404:
 *         description: Категория не найдена
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка удаления
 */
categoryRouter.delete('/:id', auth, requireAdmin, deleteCategory);

/**
 * @swagger
 * /api/category/{id}:
 *   put:
 *     summary: Обновить категорию по ID
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Новое название
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               parentId:
 *                 type: string
 *                 nullable: true
 *               parentCatName:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Категория успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Категория не найдена
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка обновления
 */
categoryRouter.put('/:id', auth, requirePermission(PERM.CATALOG), validateBody(categoryUpdateSchema), updatedCategory);

export default categoryRouter;
