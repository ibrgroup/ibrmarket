import { Router } from 'express';
import { yookassaWebhookController } from '../controllers/order.controller.js';

const paymentRouter = Router();

/**
 * POST /api/payment/yookassa/webhook
 * Webhook ЮKassa. Без auth. Проверка через API, идемпотентная обработка.
 */
paymentRouter.post('/webhook', yookassaWebhookController);

export default paymentRouter;
