import { Router } from 'express';
import {
  addAddressController,
  deleteAddressController,
  editAddress,
  getAddressController,
  getSingleAddressController,
} from '../controllers/address.controller.js';
import auth from '../middlewares/auth.js';
import { addressRateLimiter } from '../middlewares/rateLimiter.js';

const addressRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Address
 *   description: Address management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       required:
 *         - address_line
 *         - city
 *         - state
 *         - country
 *         - pincode
 *         - mobile
 *       properties:
 *         _id:
 *           type: string
 *           example: 64a1b2c3d4e5f6a7b8c9d0e1
 *         address_line:
 *           type: string
 *           example: улица Пушкина, дом 10
 *         city:
 *           type: string
 *           example: Москва
 *         state:
 *           type: string
 *           example: Московская область
 *         country:
 *           type: string
 *           example: Россия
 *         pincode:
 *           type: string
 *           example: 101000
 *         mobile:
 *           type: string
 *           example: +79991234567
 *         userId:
 *           type: string
 *           example: 64a1b2c3d4e5f6a7b8c9d0e1
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/address/add:
 *   post:
 *     summary: Add a new address
 *     tags: [Address]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       201:
 *         description: Address created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       400:
 *         description: Invalid address data
 *       401:
 *         description: Unauthorized
 */
addressRouter.post('/add', auth, addressRateLimiter, addAddressController);

/**
 * @swagger
 * /api/address/get:
 *   get:
 *     summary: Get all addresses for the authenticated user
 *     tags: [Address]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Address'
 *       401:
 *         description: Unauthorized
 */
addressRouter.get('/get', auth, getAddressController);

/**
 * @swagger
 * /api/address/{id}:
 *   get:
 *     summary: Get address by ID
 *     tags: [Address]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       404:
 *         description: Address not found
 *       401:
 *         description: Unauthorized
 */
addressRouter.get('/:id', auth, getSingleAddressController);

/**
 * @swagger
 * /api/address/{id}:
 *   put:
 *     summary: Edit address by ID
 *     tags: [Address]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       400:
 *         description: Invalid address data
 *       404:
 *         description: Address not found
 *       401:
 *         description: Unauthorized
 */
addressRouter.put('/:id', auth, addressRateLimiter, editAddress);

/**
 * @swagger
 * /api/address/{id}:
 *   delete:
 *     summary: Delete address by ID
 *     tags: [Address]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       404:
 *         description: Address not found
 *       401:
 *         description: Unauthorized
 */
addressRouter.delete('/:id', auth, addressRateLimiter, deleteAddressController);

export default addressRouter;
