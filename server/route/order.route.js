import { Router } from 'express';
import {
	createOrderController,
	createPaymentYooKassaController,
	payWithSavedYooKassaController,
	deleteOrder,
	getOrderDetailsController,
	getOrderByIdController,
	getTotalOrdersCountController,
	getUserOrderDetailsController,
	syncPaymentOrderController,
	totalSalesController,
	totalUsersController,
	updateOrderStatusController,
} from '../controllers/order.controller.js';
import auth from '../middlewares/auth.js';
import loadUserRole from '../middlewares/loadUserRole.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import requirePermission from '../middlewares/requirePermission.js';
import { PERM } from '../utils/permissions.js';

const orderRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Операции с заказами
 */

/**
 * @swagger
 * /api/order/create:
 *   post:
 *     summary: Создать заказ
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: delivery_address (ObjectId). Товары берутся из корзины, корзина очищается.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [delivery_address]
 *             properties:
 *               delivery_address:
 *                 type: string
 *                 description: ID адреса доставки
 *     responses:
 *       201:
 *         description: Заказ создан (статус WAITING_PAYMENT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Корзина пуста или нет delivery_address
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
orderRouter.post('/create', auth, createOrderController);

/**
 * @swagger
 * /api/order/payment/yookassa/init:
 *   post:
 *     summary: Инициализация оплаты ЮKassa (redirect)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *               return_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: confirmation_url для редиректа
 *       400:
 *         description: Заказ не в статусе ожидания оплаты
 *       401:
 *         description: Неавторизован
 *       502:
 *         description: Ошибка платёжной системы
 */
orderRouter.post('/payment/yookassa/init', auth, createPaymentYooKassaController);
orderRouter.post('/payment/yookassa/pay-with-saved', auth, payWithSavedYooKassaController);

/**
 * @swagger
 * /api/order/order-list:
 *   get:
 *     summary: Получить список всех заказов (пагинация, для админа)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Количество заказов на страницу
 *     responses:
 *       200:
 *         description: Список заказов и пагинация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Order"
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
orderRouter.get('/order-list', auth, requirePermission(PERM.ORDERS), getOrderDetailsController);

/**
 * @swagger
 * /api/order/order-status/{id}:
 *   put:
 *     summary: Изменить статус заказа
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID заказа
 *     requestBody:
 *       required: true
 *       description: Новый статус заказа
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Статус заказа успешно изменён
 *       400:
 *         description: Неверные данные
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
orderRouter.put('/order-status/:id', auth, requireAdmin, updateOrderStatusController);

/**
 * @swagger
 * /api/order/count:
 *   get:
 *     summary: Получить общее количество заказов
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Количество заказов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
orderRouter.get('/count', auth, requirePermission(PERM.ORDERS), getTotalOrdersCountController);

/**
 * @swagger
 * /api/order/sales:
 *   get:
 *     summary: Получить общую сумму продаж
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Сумма всех продаж
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSales:
 *                   type: number
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
orderRouter.get('/sales', auth, requirePermission(PERM.FINANCE), totalSalesController);

/**
 * @swagger
 * /api/order/users:
 *   get:
 *     summary: Получить статистику пользователей по месяцам
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Месячная статистика пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 TotalUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       TotalUsers:
 *                         type: integer
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
orderRouter.get('/users', auth, requirePermission(PERM.USERS), totalUsersController);

/**
 * @swagger
 * /api/order/order-list/orders:
 *   get:
 *     summary: Получить список заказов пользователя
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список заказов пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Order"
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
orderRouter.get('/order-list/orders', auth, getUserOrderDetailsController);

/**
 * @swagger
 * /api/order/{id}/sync-payment:
 *   post:
 *     summary: Синхронизировать статус оплаты с ЮKassa (для страницы успеха)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: order_status (PAID или WAITING_PAYMENT)
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Заказ не найден
 */
orderRouter.post('/:id/sync-payment', auth, syncPaymentOrderController);

/**
 * @swagger
 * /api/order/{id}:
 *   get:
 *     summary: Получить один заказ по ID (только свой заказ)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID заказа
 *     responses:
 *       200:
 *         description: Заказ (order / data)
 *       400:
 *         description: id не передан
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Заказ не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
orderRouter.get('/:id', auth, loadUserRole, getOrderByIdController);

/**
 * @swagger
 * /api/order/deleteOrder/{id}:
 *   delete:
 *     summary: Удалить заказ
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID заказа
 *     responses:
 *       200:
 *         description: Заказ успешно удалён
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Заказ не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
orderRouter.delete('/deleteOrder/:id', auth, requireAdmin, deleteOrder);

export default orderRouter;
