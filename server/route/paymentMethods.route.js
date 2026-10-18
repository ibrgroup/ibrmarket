import { Router } from 'express';
import {
	addPaymentMethodController,
	deletePaymentMethodController,
	getPaymentMethodsController,
	setDefaultPaymentMethodController,
} from '../controllers/paymentMethods.controller.js';
import allowInternalOrAuth from '../middlewares/allowInternalOrAuth.js';
import auth from '../middlewares/auth.js';

const paymentMethodsRouter = Router();

paymentMethodsRouter.get('/', allowInternalOrAuth, getPaymentMethodsController);
paymentMethodsRouter.post('/', allowInternalOrAuth, addPaymentMethodController);
paymentMethodsRouter.delete('/:id', auth, deletePaymentMethodController);
paymentMethodsRouter.put('/:id/default', auth, setDefaultPaymentMethodController);

export default paymentMethodsRouter;
