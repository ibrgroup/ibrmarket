import { Router } from 'express';
import {
  addToCartItemController,
  deleteCartItemQtyController,
  emptyCartController,
  getCartItemController,
  mergeCartController,
  updateCartItemQtyController,
} from '../controllers/cart.controller.js';
import auth from '../middlewares/auth.js';

const cartRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Cart management and operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *         - subTotal
 *         - userId
 *         - productTitle
 *         - image
 *         - rating
 *         - price
 *       properties:
 *         _id:
 *           type: string
 *           example: 64a1b2c3d4e5f6a7b8c9d0e1
 *         productId:
 *           type: string
 *           example: 613b6d0c8f3a2a001f847b48
 *         productTitle:
 *           type: string
 *           example: Samsung Galaxy S23
 *         image:
 *           type: string
 *           example: https://example.com/image.jpg
 *         rating:
 *           type: number
 *           example: 4.7
 *         price:
 *           type: number
 *           example: 49990
 *         oldPrice:
 *           type: number
 *           example: 59900
 *         discount:
 *           type: number
 *           example: 17
 *         size:
 *           type: string
 *           example: 'XL'
 *         weight:
 *           type: string
 *           example: '200g'
 *         ram:
 *           type: string
 *           example: '8GB'
 *         quantity:
 *           type: number
 *           example: 2
 *         subTotal:
 *           type: number
 *           example: 99980
 *         userId:
 *           type: string
 *           example: 649ae3b6d1a4c108ea5cf1b0
 *         brand:
 *           type: string
 *           example: Samsung
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add an item to the cart
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartItem'
 *     responses:
 *       201:
 *         description: Item successfully added to cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartItem'
 *       400:
 *         description: Invalid item data
 *       401:
 *         description: Unauthorized
 */
cartRouter.post('/add', auth, addToCartItemController);

/**
 * @swagger
 * /api/cart/get:
 *   get:
 *     summary: Get cart items for the authenticated user
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of cart items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CartItem'
 *       401:
 *         description: Unauthorized
 */
cartRouter.get('/get', auth, getCartItemController);

/**
 * @swagger
 * /api/cart/update-qty:
 *   put:
 *     summary: Update the quantity (and possibly other details) of a cart item
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _id
 *               - qty
 *             properties:
 *               _id:
 *                 type: string
 *                 example: 64a1b2c3d4e5f6a7b8c9d0e1
 *               qty:
 *                 type: number
 *                 example: 2
 *               subTotal:
 *                 type: number
 *                 example: 24990
 *               size:
 *                 type: string
 *                 example: XL
 *               ram:
 *                 type: string
 *                 example: "8GB"
 *               weight:
 *                 type: string
 *                 example: "200g"
 *     responses:
 *       200:
 *         description: Cart item updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartItem'
 *       400:
 *         description: Missing or invalid data
 *       401:
 *         description: Unauthorized
 */
cartRouter.put('/update-qty', auth, updateCartItemQtyController);

/**
 * @swagger
 * /api/cart/delete-cart-item/{id}:
 *   delete:
 *     summary: Remove an item from cart by cart item ID
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item id
 *     responses:
 *       200:
 *         description: Item removed
 *       404:
 *         description: Cart item not found
 *       401:
 *         description: Unauthorized
 */
cartRouter.delete('/delete-cart-item/:id', auth, deleteCartItemQtyController);

/**
 * @swagger
 * /api/cart/emptyCart/{id}:
 *   delete:
 *     summary: Remove all items from the user's cart
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to empty cart for
 *     responses:
 *       200:
 *         description: Cart emptied successfully
 *       401:
 *         description: Unauthorized
 */
cartRouter.delete('/emptyCart/:id', auth, emptyCartController);

/**
 * @swagger
 * /api/cart/merge:
 *   post:
 *     summary: Merge guest cart with authenticated user's server cart (on login)
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
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
 *                 items:
 *                   $ref: '#/components/schemas/CartItem'
 *     responses:
 *       200:
 *         description: Carts merged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 adjustedItems:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 *                 message:
 *                   type: string
 *                   example: "Merge successful, some items adjusted for stock limits"
 *       400:
 *         description: guestItems must be an array
 *       401:
 *         description: Unauthorized
 */
cartRouter.post('/merge', auth, mergeCartController);

export default cartRouter;
