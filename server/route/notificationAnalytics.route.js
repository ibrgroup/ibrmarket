import { Router } from 'express';
import { getSummary, recordEvent } from '../controllers/notificationAnalytics.controller.js';
import auth from '../middlewares/auth.js';

const notificationAnalyticsRouter = Router();

/**
 * @swagger
 * tags:
 *   name: NotificationAnalytics
 *   description: Сбор пользовательской аналитики по уведомлениям (открытие, взаимодействие и др.)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationAnalytics:
 *       type: object
 *       required:
 *         - userId
 *         - eventType
 *       properties:
 *         _id:
 *           type: string
 *           example: 65a3c0e2a04c9d345678910f
 *         userId:
 *           type: string
 *           example: 65a3c0e2a04c9d34567890f9
 *         eventType:
 *           type: string
 *           enum:
 *             - dropdown_opened
 *             - dropdown_closed
 *             - notification_click
 *             - mark_read
 *             - mark_all_read
 *             - remove
 *             - clear_all
 *           example: dropdown_opened
 *         meta:
 *           type: object
 *           example: { notificationId: "65a3...", extra: "clicked-button" }
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/notification-analytics:
 *   post:
 *     summary: Записать событие пользовательской аналитики уведомлений
 *     description: Сохраняет событие взаимодействия пользователя с уведомлениями (action, открытие, очистка и др.)
 *     tags: [NotificationAnalytics]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *             properties:
 *               eventType:
 *                 type: string
 *                 description: Тип события
 *                 enum: [dropdown_opened, dropdown_closed, notification_click, mark_read, mark_all_read, remove, clear_all]
 *                 example: notification_click
 *               meta:
 *                 type: object
 *                 description: Дополнительные данные о событии
 *                 example: { notificationId: "65a3..." }
 *     responses:
 *       201:
 *         description: Событие успешно записано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationAnalytics'
 *       400:
 *         description: Ошибка валидации данных
 *       500:
 *         description: Серверная ошибка при записи события
 */

/**
 * @swagger
 * /api/notification-analytics/summary:
 *   get:
 *     summary: Получить сводку пользовательской аналитики по событиям
 *     description: Возвращает сводку счетчиков событий по их типам за N последних дней (по умолчанию 7, максимум 90)
 *     tags: [NotificationAnalytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 90
 *           default: 7
 *         description: За сколько дней вернуть аналитику
 *     responses:
 *       200:
 *         description: Сводная аналитика по типам событий
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 days:
 *                   type: integer
 *                   example: 7
 *                 byType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       eventType:
 *                         type: string
 *                         example: mark_read
 *                       count:
 *                         type: integer
 *                         example: 15
 *       500:
 *         description: Не удалось получить сводку аналитики
 */

notificationAnalyticsRouter.post('/', auth, recordEvent);
notificationAnalyticsRouter.get('/summary', auth, getSummary);

export default notificationAnalyticsRouter;
