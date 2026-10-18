import { Router } from 'express';
import {
  addToMyListController,
  deleteToMyListController,
  getMyListController,
  mergeWishlistController,
} from '../controllers/mylist.controller.js';
import auth from '../middlewares/auth.js';

/**
 * @swagger
 * tags:
 *   name: MyList
 *   description: Управление списком избранного пользователя (wishlist)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MyListItem:
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
 *           example: 65a3c0e2a04c9d34567890bb
 *         productId:
 *           type: string
 *           example: 65a3c0e2a04c9d34567890aa
 *         userId:
 *           type: string
 *           example: 65a3c0e2a04c9d34567890f9
 *         productTitle:
 *           type: string
 *           example: Samsung Galaxy S24
 *         image:
 *           type: string
 *           example: https://domain.com/images/product.jpg
 *         rating:
 *           type: number
 *           example: 4.8
 *         price:
 *           type: number
 *           example: 59000
 *         oldPrice:
 *           type: number
 *           example: 63999
 *         brand:
 *           type: string
 *           example: Samsung
 *         discount:
 *           type: number
 *           example: 8
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/myList/add:
 *   post:
 *     summary: Добавить товар в список избранного пользователя
 *     tags: [MyList]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MyListItem'
 *     responses:
 *       200:
 *         description: The product saved in the my list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Item already in my list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: boolean
 */

/**
 * @swagger
 * /api/myList:
 *   get:
 *     summary: Получить все товары из списка избранного пользователя
 *     tags: [MyList]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Список товаров в избранном пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MyListItem'
 */

/**
 * @swagger
 * /api/myList/{id}:
 *   delete:
 *     summary: Удалить товар из списка избранного пользователя по id элемента
 *     tags: [MyList]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Идентификатор элемента списка избранного
 *     responses:
 *       200:
 *         description: The item removed from My List
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: The item with this given id was not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/myList/merge:
 *   post:
 *     summary: Объединить wishlist гостя с авторизованным (при входе в систему)
 *     tags: [MyList]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestItems:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MyListItem'
 *     responses:
 *       200:
 *         description: Wishlist merged successfully
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MyListItem'
 *       400:
 *         description: guestItems must be an array
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: boolean
 */

const myListRouter = Router();

myListRouter.post('/add', auth, addToMyListController);
myListRouter.get('/', auth, getMyListController);
myListRouter.delete('/:id', auth, deleteToMyListController);
myListRouter.post('/merge', auth, mergeWishlistController);

export default myListRouter;
