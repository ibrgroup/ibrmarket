import { Router } from 'express';
import {
	addBanner,
	deleteBanner,
	getBanner,
	getBanners,
	updatedBanner,
	uploadImages,
} from '../controllers/bannerV1.controller.js';
import { removeImageFromCloudinary } from '../controllers/category.controller.js';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import requirePermission from '../middlewares/requirePermission.js';
import { PERM } from '../utils/permissions.js';

const bannerV1Router = Router();

/**
 * @swagger
 * tags:
 *   name: BannerV1
 *   description: Управление баннерами (v1)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BannerV1:
 *       type: object
 *       required:
 *         - bannerTitle
 *         - images
 *         - price
 *         - alignInfo
 *       properties:
 *         _id:
 *           type: string
 *           example: 64a1b2c3d4e5f6a7b8c9d0e1
 *         bannerTitle:
 *           type: string
 *           example: Весенняя распродажа
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             example: https://res.cloudinary.com/demo/image/upload/sample.jpg
 *         catId:
 *           type: string
 *           example: 6321aae091dac1d8bc8f282b
 *         subCatId:
 *           type: string
 *           example: 6321aae091dac1d8bc8f282c
 *         thirdsubCatId:
 *           type: string
 *           example: 6321aae091dac1d8bc8f282d
 *         price:
 *           type: number
 *           example: 1999
 *         alignInfo:
 *           type: string
 *           description: Размещение текста и др. данных на баннере
 *           example: "center"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/bannerV1/uploadImages:
 *   post:
 *     summary: Загрузить изображения баннера на Cloudinary
 *     tags: [BannerV1]
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
 *         description: Нет файлов для загрузки
 *       401:
 *         description: Неавторизован
 */
bannerV1Router.post(
	'/uploadImages',
	auth,
	requirePermission(PERM.CONTENT),
	upload.array('images'),
	uploadImages,
);

/**
 * @swagger
 * /api/bannerV1/add:
 *   post:
 *     summary: Создать новый баннер
 *     tags: [BannerV1]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BannerV1'
 *     responses:
 *       201:
 *         description: Баннер успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BannerV1'
 *       400:
 *         description: Некорректные данные для баннера
 *       401:
 *         description: Неавторизован
 */
bannerV1Router.post('/add', auth, requirePermission(PERM.CONTENT), addBanner);

/**
 * @swagger
 * /api/banner:
 *   get:
 *     summary: Получить все баннеры
 *     tags: [BannerV1]
 *     responses:
 *       200:
 *         description: Список баннеров
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BannerV1'
 */
bannerV1Router.get('/', getBanners);

/**
 * @swagger
 * /api/bannerV1/{id}:
 *   get:
 *     summary: Получить баннер по id
 *     tags: [BannerV1]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Идентификатор баннера
 *     responses:
 *       200:
 *         description: Баннер найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BannerV1'
 *       404:
 *         description: Баннер не найден
 */
bannerV1Router.get('/:id', getBanner);

/**
 * @swagger
 * /api/bannerV1/deteleImage:
 *   delete:
 *     summary: Удалить изображение баннера с Cloudinary
 *     tags: [BannerV1]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 example: https://res.cloudinary.com/demo/image/upload/sample.jpg
 *     responses:
 *       200:
 *         description: Изображение успешно удалено
 *       400:
 *         description: Некорректный запрос
 *       401:
 *         description: Неавторизован
 */
bannerV1Router.delete(
	'/deteleImage',
	auth,
	requirePermission(PERM.CONTENT),
	removeImageFromCloudinary,
);

/**
 * @swagger
 * /api/bannerV1/{id}:
 *   delete:
 *     summary: Удалить баннер по ID (и связанные изображения из Cloudinary)
 *     tags: [BannerV1]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Идентификатор баннера
 *     responses:
 *       200:
 *         description: Баннер удалён
 *       404:
 *         description: Баннер не найден
 *       401:
 *         description: Неавторизован
 */
bannerV1Router.delete('/:id', auth, requirePermission(PERM.CONTENT), deleteBanner);

/**
 * @swagger
 * /api/bannerV1/{id}:
 *   put:
 *     summary: Обновить баннер по ID
 *     tags: [BannerV1]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Идентификатор баннера
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BannerV1'
 *     responses:
 *       200:
 *         description: Баннер обновлён успешно
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BannerV1'
 *       400:
 *         description: Некорректные данные для обновления
 *       404:
 *         description: Баннер не найден
 *       401:
 *         description: Неавторизован
 */
bannerV1Router.put('/:id', auth, requirePermission(PERM.CONTENT), updatedBanner);

export default bannerV1Router;
