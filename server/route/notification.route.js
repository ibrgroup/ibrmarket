import { Router } from 'express';
import {
  clearAll,
  createNotification,
  listNotifications,
  markAllAsRead,
  markAsRead,
  removeNotification,
} from '../controllers/notification.controller.js';
import auth from '../middlewares/auth.js';

const notificationRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - title
 *         - message
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           example: 64a1b2c3d4e5f6a7b8c9d0e1
 *         title:
 *           type: string
 *           example: Новый заказ!
 *         message:
 *           type: string
 *           example: Ваш заказ #123 создан успешно
 *         type:
 *           type: string
 *           enum: [order, product, system, promotional, security, payment, delivery]
 *           example: order
 *         read:
 *           type: boolean
 *           example: false
 *         actionUrl:
 *           type: string
 *           example: /orders/123
 *         data:
 *           type: object
 *           example: { orderId: "123" }
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
 * /api/notifications:
 *   get:
 *     summary: Получить список уведомлений пользователя
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Страница (по умолчанию 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Количество на страницу (по умолчанию 20, максимум 100)
 *       - in: query
 *         name: onlyUnread
 *         schema:
 *           type: boolean
 *         description: Только непрочитанные уведомления
 *       - in: query
 *         name: types
 *         schema:
 *           type: string
 *         description: Типы уведомлений через запятую (например "order,system")
 *     responses:
 *       200:
 *         description: Список уведомлений
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 unread:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
notificationRouter.get('/', auth, listNotifications);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Создать новое уведомление
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       201:
 *         description: Уведомление создано успешно
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Не валидные данные
 *       401:
 *         description: Unauthorized
 */
notificationRouter.post('/', auth, createNotification);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Пометить уведомление как прочитанное
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID уведомления
 *     responses:
 *       200:
 *         description: Статус успеха
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Не найдено
 */
notificationRouter.patch('/:id/read', auth, markAsRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Пометить все уведомления пользователя как прочитанные
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Статус успеха
 *       401:
 *         description: Unauthorized
 */
notificationRouter.patch('/read-all', auth, markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Удалить уведомление по id
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID уведомления
 *     responses:
 *       200:
 *         description: Успешное удаление уведомления
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Не найдено
 */
notificationRouter.delete('/:id', auth, removeNotification);

/**
 * @swagger
 * /api/notifications:
 *   delete:
 *     summary: Очистить все уведомления пользователя
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Все уведомления очищены
 *       401:
 *         description: Unauthorized
 */
notificationRouter.delete('/', auth, clearAll);

export default notificationRouter;
