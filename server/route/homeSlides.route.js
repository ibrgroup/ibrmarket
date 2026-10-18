import { Router } from 'express';
import {
	addHomeSlide,
	deleteMultipleSlides,
	deleteSlide,
	getHomeSlides,
	getSlide,
	removeImageFromCloudinary,
	updatedSlide,
	uploadImages,
} from '../controllers/homeSlider.controller.js';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import requirePermission from '../middlewares/requirePermission.js';
import { PERM } from '../utils/permissions.js';

const homeSlidesRouter = Router();

/**
 * @swagger
 * tags:
 *   name: HomeSlides
 *   description: Управление домашними слайдами (карусель баннеров на главной)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     HomeSlide:
 *       type: object
 *       required:
 *         - images
 *       properties:
 *         _id:
 *           type: string
 *           example: 64a1b2c3d4e5f6a7b8c9d0e1
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             example: https://res.cloudinary.com/ibr/image/upload/v1/banner1.jpg
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/homeSlides/uploadImages:
 *   post:
 *     summary: Загрузить изображения на Cloudinary
 *     tags: [HomeSlides]
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
 *         description: Не переданы изображения
 *       401:
 *         description: Не авторизован
 */
homeSlidesRouter.post(
	'/uploadImages',
	auth,
	requirePermission(PERM.CONTENT),
	upload.array('images'),
	uploadImages,
);

/**
 * @swagger
 * /api/homeSlides/add:
 *   post:
 *     summary: Создать новый слайд из ранее загруженных изображений
 *     tags: [HomeSlides]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Слайд успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomeSlide'
 *       400:
 *         description: Нет изображений для создания слайда
 *       401:
 *         description: Не авторизован
 */
homeSlidesRouter.post('/add', auth, requirePermission(PERM.CONTENT), addHomeSlide);

/**
 * @swagger
 * /api/homeSlides:
 *   get:
 *     summary: Получить все слайды
 *     tags: [HomeSlides]
 *     responses:
 *       200:
 *         description: Успешный возврат списка слайдов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HomeSlide'
 *       404:
 *         description: Слайды не найдены
 */
homeSlidesRouter.get('/', getHomeSlides);

/**
 * @swagger
 * /api/homeSlides/{id}:
 *   get:
 *     summary: Получить слайд по ID
 *     tags: [HomeSlides]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Идентификатор слайда
 *     responses:
 *       200:
 *         description: Слайд найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomeSlide'
 *       404:
 *         description: Слайд не найден
 */
homeSlidesRouter.get('/:id', getSlide);

/**
 * @swagger
 * /api/homeSlides/deteleImage:
 *   delete:
 *     summary: Удалить изображение из Cloudinary по URL
 *     tags: [HomeSlides]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imgUrl:
 *                 type: string
 *                 description: URL изображения для удаления
 *     responses:
 *       200:
 *         description: Изображение удалено
 *       400:
 *         description: Некорректный URL изображения
 *       401:
 *         description: Не авторизован
 */
homeSlidesRouter.delete(
	'/deteleImage',
	auth,
	requirePermission(PERM.CONTENT),
	removeImageFromCloudinary,
);

/**
 * @swagger
 * /api/homeSlides/{id}:
 *   delete:
 *     summary: Удалить слайд и связанные с ним изображения
 *     tags: [HomeSlides]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID слайда для удаления
 *     responses:
 *       200:
 *         description: Слайд удалён
 *       404:
 *         description: Слайд не найден
 *       401:
 *         description: Не авторизован
 */
homeSlidesRouter.delete('/:id', auth, requirePermission(PERM.CONTENT), deleteSlide);

/**
 * @swagger
 * /api/homeSlides/deleteMultiple:
 *   delete:
 *     summary: Удалить несколько слайдов и их изображения
 *     tags: [HomeSlides]
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
 *                 description: Массив идентификаторов слайдов
 *     responses:
 *       200:
 *         description: Слайды удалены
 *       400:
 *         description: Некорректные данные
 */
homeSlidesRouter.delete(
	'/deleteMultiple',
	auth,
	requirePermission(PERM.CONTENT),
	deleteMultipleSlides,
);

/**
 * @swagger
 * /api/homeSlides/{id}:
 *   put:
 *     summary: Обновить слайд (замена изображений)
 *     tags: [HomeSlides]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID слайда
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Слайд обновлён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HomeSlide'
 *       400:
 *         description: Ошибка при обновлении слайда
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Слайд не найден
 */
homeSlidesRouter.put('/:id', auth, requirePermission(PERM.CONTENT), updatedSlide);

export default homeSlidesRouter;
