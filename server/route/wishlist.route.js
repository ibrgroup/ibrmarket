import { Router } from 'express';
import {
  addToWishlistController,
  deleteFromWishlistController,
  getWishlistController,
  mergeWishlistController,
} from '../controllers/wishlist.controller.js';
import auth from '../middlewares/auth.js';

const wishlistRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: Wishlist
 *     description: Операции с wish-листом пользователя (добавление, удаление, получение, слияние)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WishlistItem:
 *       type: object
 *       required:
 *         - productId
 *         - userId
 *         - productTitle
 *         - image
 *         - rating
 *         - price
 *         - oldPrice
 *         - brand
 *         - discount
 *       properties:
 *         _id:
 *           type: string
 *           description: Уникальный идентификатор записи в wish-листе
 *           example: 648aaaca0d1c2b7a9ba6c790
 *         productId:
 *           type: string
 *           description: Уникальный идентификатор товара
 *           example: "648a989f5c2e3c43fca44aa2"
 *         userId:
 *           type: string
 *           description: Уникальный идентификатор пользователя
 *           example: "6489f0ffe6509e3a2797f8ff"
 *         productTitle:
 *           type: string
 *           description: Название товара
 *           example: "Apple iPhone 13 Pro"
 *         image:
 *           type: string
 *           description: Ссылка на главное изображение товара
 *           example: "https://cdn.shop.com/iphone13pro.png"
 *         rating:
 *           type: number
 *           format: float
 *           description: Средний рейтинг товара
 *           example: 4.9
 *         price:
 *           type: number
 *           description: Актуальная цена товара
 *           example: 89990
 *         oldPrice:
 *           type: number
 *           description: Старая цена товара (если есть)
 *           example: 99990
 *         brand:
 *           type: string
 *           description: Бренд товара
 *           example: "Apple"
 *         discount:
 *           type: number
 *           description: Скидка на товар в процентах
 *           example: 10
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата добавления в wish-лист
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления записи wish-листа
 */

/**
 * @swagger
 * /api/wishlist/add:
 *   post:
 *     summary: Добавить товар в wish-лист пользователя
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - productTitle
 *               - image
 *               - rating
 *               - price
 *               - oldPrice
 *               - brand
 *               - discount
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Идентификатор товара
 *               productTitle:
 *                 type: string
 *                 description: Название товара
 *               image:
 *                 type: string
 *                 description: Ссылка на изображение товара
 *               rating:
 *                 type: number
 *                 description: Средний рейтинг товара
 *               price:
 *                 type: number
 *                 description: Текущая цена товара
 *               oldPrice:
 *                 type: number
 *                 description: Старая цена товара
 *               brand:
 *                 type: string
 *                 description: Бренд
 *               discount:
 *                 type: number
 *                 description: Скидка (в процентах)
 *           example:
 *             productId: "648a989f5c2e3c43fca44aa2"
 *             productTitle: "Apple iPhone 13 Pro"
 *             image: "https://cdn.shop.com/iphone13pro.png"
 *             rating: 4.9
 *             price: 89990
 *             oldPrice: 99990
 *             brand: "Apple"
 *             discount: 10
 *     responses:
 *       200:
 *         description: Товар успешно добавлен в wish-лист
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: boolean, example: false }
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "The product saved in the wishlist" }
 *       400:
 *         description: Товар уже есть в wish-листе пользователя
 *       401:
 *         description: Пользователь не авторизован
 *       500:
 *         description: Ошибка сервера
 */
wishlistRouter.post('/add', auth, addToWishlistController);

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Получить товары wish-листа текущего пользователя
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список товаров wish-листа пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: boolean, example: false }
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WishlistItem'
 *       401:
 *         description: Пользователь не авторизован
 *       500:
 *         description: Ошибка сервера
 */
wishlistRouter.get('/', auth, getWishlistController);

/**
 * @swagger
 * /wishlist/{id}:
 *   delete:
 *     summary: Удалить товар из wish-листа по его идентификатору
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Идентификатор элемента wish-листа (MongoDB ObjectId)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар успешно удалён из wish-листа
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: boolean, example: false }
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "The item removed from wishlist" }
 *       404:
 *         description: Элемент не найден или не был удалён
 *       401:
 *         description: Пользователь не авторизован
 *       500:
 *         description: Ошибка сервера
 */
wishlistRouter.delete('/:id', auth, deleteFromWishlistController);

/**
 * @swagger
 * /api/wishlist/merge:
 *   post:
 *     summary: Слить guest-wishlist с wish-листом пользователя при логине (атомарно)
 *     description: |
 *       Используется для переноса локального wish-листа (гостя) в аккаунт пользователя после авторизации.<br>
 *       - Слияние проводится атомарно (MongoDB транзакция)
 *       - Все guest-товары, которых нет на сервере, будут добавлены в wish-лист пользователя
 *       - Дубликаты не добавляются<br>
 *       - После успешного запроса возвращает итоговый wish-лист, доступный пользователю
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guestItems
 *             properties:
 *               guestItems:
 *                 type: array
 *                 description: Массив товаров из guest wish-листа (локального хранилища)
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: string }
 *                     productTitle: { type: string }
 *                     image: { type: string }
 *                     rating: { type: number }
 *                     price: { type: number }
 *                     oldPrice: { type: number }
 *                     brand: { type: string }
 *                     discount: { type: number }
 *                 example:
 *                   - productId: "648a989f5c2e3c43fca44aa2"
 *                     productTitle: "Apple iPhone 13 Pro"
 *                     image: "https://cdn.shop.com/iphone13pro.png"
 *                     rating: 4.9
 *                     price: 89990
 *                     oldPrice: 99990
 *                     brand: "Apple"
 *                     discount: 10
 *     responses:
 *       200:
 *         description: Wish-лист успешно слит, возвращён актуальный список
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Wishlist merged successfully" }
 *                 error: { type: boolean, example: false }
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WishlistItem'
 *       400:
 *         description: guestItems не передан или не является массивом
 *       401:
 *         description: Пользователь не авторизован
 *       500:
 *         description: Неожиданная ошибка сервера
 */
wishlistRouter.post('/merge', auth, mergeWishlistController);

export default wishlistRouter;
