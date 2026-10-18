import { Router } from 'express';
import {
	addBlog,
	deleteBlog,
	getBlog,
	getBlogs,
	updateBlog,
	uploadImages,
} from '../controllers/blog.controller.js';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import requirePermission from '../middlewares/requirePermission.js';
import { PERM } from '../utils/permissions.js';

const blogRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: Blog management (CRUD + image upload)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         _id:
 *           type: string
 *           example: 650c9d8cf85d0b06e5dfc7d3
 *         title:
 *           type: string
 *           example: "10 советов по маркетингу"
 *         description:
 *           type: string
 *           example: "Полезные советы для развития вашего бизнеса..."
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             description: Ссылка на изображение (cloudinary url)
 *             example: "https://res.cloudinary.com/demo/image/upload/v1234567/blog-image.png"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/blog/uploadImages:
 *   post:
 *     summary: Загрузка изображений для блога (Cloudinary)
 *     tags: [Blog]
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
 *                     description: Cloudinary image url
 *       400:
 *         description: Изображения не предоставлены
 *       401:
 *         description: Неавторизован
 */
blogRouter.post(
	'/uploadImages',
	auth,
	requirePermission(PERM.CONTENT),
	upload.array('images'),
	uploadImages,
);

/**
 * @swagger
 * /api/blog/add:
 *   post:
 *     summary: Создать новый блог
 *     tags: [Blog]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Как продвигать стартап"
 *               description:
 *                 type: string
 *                 example: "Гайд по запуску успешного стартапа"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "https://res.cloudinary.com/demo/image/upload/v1234567/blog-image.png"
 *     responses:
 *       201:
 *         description: Блог успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Отсутствует заголовок или описание
 *       401:
 *         description: Неавторизован
 */
blogRouter.post('/add', auth, requirePermission(PERM.CONTENT), addBlog);

/**
 * @swagger
 * /api/blog:
 *   get:
 *     summary: Получить список блогов с пагинацией
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Номер страницы (по умолчанию 1)
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Количество блогов на страницу (по умолчанию 10)
 *     responses:
 *       200:
 *         description: Список блогов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blogs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Blog'
 *                 totalPages:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       404:
 *         description: Страница не найдена
 */
blogRouter.get('/', getBlogs);

/**
 * @swagger
 * /api/blog/{id}:
 *   get:
 *     summary: Получить блог по ID
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID блога
 *     responses:
 *       200:
 *         description: Блог найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       404:
 *         description: Блог не найден
 */
blogRouter.get('/:id', getBlog);

/**
 * @swagger
 * /api/blog/{id}:
 *   put:
 *     summary: Обновить блог по ID
 *     tags: [Blog]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID блога
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Обновленный заголовок"
 *               description:
 *                 type: string
 *                 example: "Обновленное описание"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "https://res.cloudinary.com/demo/image/upload/v1234567/blog-image.png"
 *     responses:
 *       200:
 *         description: Блог успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Ошибка данных для обновления
 *       404:
 *         description: Блог не найден
 *       401:
 *         description: Неавторизован
 */
blogRouter.put('/:id', auth, requirePermission(PERM.CONTENT), updateBlog);

/**
 * @swagger
 * /api/blog/{id}:
 *   delete:
 *     summary: Удалить блог по ID
 *     tags: [Blog]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID блога
 *     responses:
 *       200:
 *         description: Блог успешно удалён
 *       404:
 *         description: Блог не найден
 *       401:
 *         description: Неавторизован
 */
blogRouter.delete('/:id', auth, requirePermission(PERM.CONTENT), deleteBlog);

export default blogRouter;
