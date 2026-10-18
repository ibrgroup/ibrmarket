import { Router } from 'express';
import {
	addBanner,
	deleteBanner,
	getBanner,
	getBanners,
	updatedBanner,
	uploadImages,
} from '../controllers/bannerList2.controller.js';
import { removeImageFromCloudinary } from '../controllers/category.controller.js';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import requirePermission from '../middlewares/requirePermission.js';
import { PERM } from '../utils/permissions.js';

const bannerList2Router = Router();

/**
 * @swagger
 * tags:
 *   name: Banners
 *   description: Banner management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Banner:
 *       type: object
 *       required:
 *         - images
 *       properties:
 *         _id:
 *           type: string
 *           example: 657bb9f333fbda0020270bfd
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             example: https://res.cloudinary.com/ibr/image/upload/v1709390102/banners/abc123.jpg
 *         catId:
 *           type: string
 *           example: 65a0f376cec0f900216db2f0
 *         subCatId:
 *           type: string
 *           example: 65a0f381cec0f900216db2f2
 *         thirdsubCatId:
 *           type: string
 *           example: 65a0f38dcec0f900216db2f4
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/bannerList2/uploadImages:
 *   post:
 *     summary: Upload images to Cloudinary
 *     tags: [Banners]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
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
 *         description: Uploaded images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: boolean
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: No files to upload
 *       401:
 *         description: Unauthorized
 */
bannerList2Router.post(
	'/uploadImages',
	auth,
	requirePermission(PERM.CONTENT),
	upload.array('images'),
	uploadImages,
);

/**
 * @swagger
 * /api/bannerList2/add:
 *   post:
 *     summary: Create a new banner
 *     tags: [Banners]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       description: Banner info (with image urls)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [images]
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               catId:
 *                 type: string
 *               subCatId:
 *                 type: string
 *               thirdsubCatId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Banner created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 banner:
 *                   $ref: '#/components/schemas/Banner'
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: boolean
 *       400:
 *         description: Missing images or invalid body
 *       401:
 *         description: Unauthorized
 */
bannerList2Router.post('/add', auth, requirePermission(PERM.CONTENT), addBanner);

/**
 * @swagger
 * /api/bannerList2:
 *   get:
 *     summary: Get all banners
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: List of banners
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Banner'
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: boolean
 *       500:
 *         description: Server error
 */
bannerList2Router.get('/', getBanners);

/**
 * @swagger
 * /api/bannerList2/{id}:
 *   get:
 *     summary: Get banner by ID
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 *       404:
 *         description: Banner not found
 */
bannerList2Router.get('/:id', getBanner);

/**
 * @swagger
 * /api/bannerList2/deteleImage:
 *   delete:
 *     summary: Delete a single image file from Cloudinary
 *     tags: [Banners]
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
 *                 example: https://res.cloudinary.com/ibr/image/upload/v1709390102/banners/abc123.jpg
 *     responses:
 *       200:
 *         description: Image deleted
 *       400:
 *         description: Missing or invalid image URL
 *       401:
 *         description: Unauthorized
 */
bannerList2Router.delete(
	'/deteleImage',
	auth,
	requirePermission(PERM.CONTENT),
	removeImageFromCloudinary,
);

/**
 * @swagger
 * /api/bannerList2/{id}:
 *   delete:
 *     summary: Delete banner and remove its images from Cloudinary
 *     tags: [Banners]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *       404:
 *         description: Banner not found
 *       401:
 *         description: Unauthorized
 */
bannerList2Router.delete('/:id', auth, requirePermission(PERM.CONTENT), deleteBanner);

/**
 * @swagger
 * /api/bannerList2/{id}:
 *   put:
 *     summary: Update an existing banner
 *     tags: [Banners]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Banner ID
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
 *               catId:
 *                 type: string
 *               subCatId:
 *                 type: string
 *               thirdsubCatId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banner'
 *       400:
 *         description: Invalid body
 *       404:
 *         description: Banner not found
 *       401:
 *         description: Unauthorized
 */
bannerList2Router.put('/:id', auth, requirePermission(PERM.CONTENT), updatedBanner);

export default bannerList2Router;
