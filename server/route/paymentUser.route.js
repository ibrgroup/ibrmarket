import { Router } from 'express';
import {
	getPaymentSecurityController,
	getPaymentTransactionsController,
	updatePaymentSecurityController,
} from '../controllers/paymentUser.controller.js';
import auth from '../middlewares/auth.js';

const paymentUserRouter = Router();

paymentUserRouter.get('/transactions', auth, getPaymentTransactionsController);
paymentUserRouter.get('/security', auth, getPaymentSecurityController);
paymentUserRouter.put('/security', auth, updatePaymentSecurityController);

export default paymentUserRouter;
