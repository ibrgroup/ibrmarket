import { Router } from 'express';
import {
	addLogo,
	getLogo,
	getLogoById,
	removeImageFromCloudinary,
	updatedLogo,
	uploadImages,
} from '../controllers/logo.controller.js';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import requirePermission from '../middlewares/requirePermission.js';
import { PERM } from '../utils/permissions.js';

const logoRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Logo
 *   description: Управление логотипами компании (загрузка, обновление, удаление)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Logo:
 *       type: object
 *       required:
 *         - logo
 *       properties:
 *         _id:
 *           type: string
 *           example: 64a1b2c3d4e5f6a7b8c9d0e1
 *         logo:
 *           type: string
 *           example: https://example.com/logo.png
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/logo/uploadImages:
 *   post:
 *     summary: Загрузить одно или несколько изображений логотипа (Cloudinary)
 *     tags: [Logo]
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
 *         description: Ссылки успешно загруженных изображений
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: boolean
 *       400:
 *         description: Нет файлов для загрузки
 *       401:
 *         description: Не авторизован
 */
logoRouter.post(
	'/uploadImages',
	auth,
	requirePermission(PERM.CONTENT),
	upload.array('images'),
	uploadImages,
);

/**
 * @swagger
 * /api/logo/add:
 *   post:
 *     summary: Добавить новый логотип
 *     tags: [Logo]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Logo'
 *     responses:
 *       201:
 *         description: Логотип успешно добавлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Logo'
 *       400:
 *         description: Не указана ссылка на логотип
 *       401:
 *         description: Не авторизован
 */
logoRouter.post('/add', auth, requirePermission(PERM.CONTENT), addLogo);

/**
 * @swagger
 * /api/logo:
 *   get:
 *     summary: Получить список всех логотипов
 *     tags: [Logo]
 *     responses:
 *       200:
 *         description: Список логотипов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logo:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Logo'
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: boolean
 */
logoRouter.get('/', getLogo);

/**
 * @swagger
 * /api/logo/{id}:
 *   get:
 *     summary: Получить логотип по ID
 *     tags: [Logo]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Идентификатор логотипа
 *     responses:
 *       200:
 *         description: Логотип найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Logo'
 *       404:
 *         description: Логотип не найден
 */
logoRouter.get('/:id', getLogoById);

/**
 * @swagger
 * /api/logo/remove-image:
 *   delete:
 *     summary: Удалить изображение логотипа с Cloudinary по URL
 *     tags: [Logo]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: img
 *         schema:
 *           type: string
 *         required: true
 *         description: Ссылка на изображение логотипа (Cloudinary)
 *     responses:
 *       200:
 *         description: Изображение удалено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: boolean
 *                 success:
 *                   type: boolean
 *                 cloudinaryResult:
 *                   type: object
 *       400:
 *         description: Не указан URL изображения
 *       401:
 *         description: Не авторизован
 */
logoRouter.delete(
	'/remove-image',
	auth,
	requirePermission(PERM.CONTENT),
	removeImageFromCloudinary,
);

/**
 * @swagger
 * /api/logo/{id}:
 *   put:
 *     summary: Обновить логотип по ID
 *     tags: [Logo]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Идентификатор логотипа
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Logo'
 *     responses:
 *       200:
 *         description: Логотип успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Logo'
 *       400:
 *         description: Не указана ссылка на логотип
 *       404:
 *         description: Логотип не найден
 *       401:
 *         description: Не авторизован
 */
logoRouter.put('/:id', auth, requirePermission(PERM.CONTENT), updatedLogo);

export default logoRouter;
