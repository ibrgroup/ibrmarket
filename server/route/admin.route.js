import { Router } from 'express';
import {
	listAdminMessages,
	listAdminSupportConversations,
	patchSupportConversationStatus,
} from '../controllers/adminConversation.controller.js';
import {
	deleteUserAdmin,
	exportOrdersCsvAdmin,
	getAnalyticsAdmin,
	getBadgesAdmin,
	getMetricsAdmin,
	getOrderByIdAdmin,
	getSettingsPublicAdmin,
	listAuditLogsAdmin,
	listCategoriesAdmin,
	listOrdersAdmin,
	listProductsAdmin,
	listUsersAdmin,
	patchUserRoleAdmin,
	patchUserStatusAdmin,
} from '../controllers/admin.controller.js';
import {
	deleteOrder,
	partialReturnOrderItemController,
	updateOrderStatusController,
} from '../controllers/order.controller.js';
import auth from '../middlewares/auth.js';
import { adminRateLimiter } from '../middlewares/adminRateLimit.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import requireAnyPermission from '../middlewares/requireAnyPermission.js';
import requirePermission from '../middlewares/requirePermission.js';
import { validateBody } from '../middlewares/validateBody.js';
import { PERM } from '../utils/permissions.js';
import {
	orderStatusPatchSchema,
	orderItemReturnSchema,
	supportStatusPatchSchema,
} from '../validation/schemas.js';

const adminRouter = Router();

adminRouter.use(auth);
adminRouter.use(adminRateLimiter);

adminRouter.get('/metrics', requirePermission(PERM.FINANCE), getMetricsAdmin);
adminRouter.get('/analytics', requirePermission(PERM.FINANCE), getAnalyticsAdmin);
adminRouter.get('/badges', requireAnyPermission([PERM.ORDERS, PERM.INBOX]), getBadgesAdmin);
adminRouter.get('/settings', requirePermission(PERM.SETTINGS), getSettingsPublicAdmin);

adminRouter.get('/users', requirePermission(PERM.USERS), listUsersAdmin);
adminRouter.patch('/users/:id/role', requireAdmin, patchUserRoleAdmin);
adminRouter.patch('/users/:id/status', requireAdmin, patchUserStatusAdmin);
adminRouter.delete('/users/:id', requireAdmin, deleteUserAdmin);
adminRouter.get('/products', requirePermission(PERM.CATALOG), listProductsAdmin);
adminRouter.get('/categories', requirePermission(PERM.CATALOG), listCategoriesAdmin);
adminRouter.get('/audit-logs', requirePermission(PERM.AUDIT), listAuditLogsAdmin);

adminRouter.get('/orders/export', requirePermission(PERM.FINANCE), exportOrdersCsvAdmin);
adminRouter.get('/orders', requirePermission(PERM.ORDERS), listOrdersAdmin);
adminRouter.patch(
	'/orders/:id/status',
	requirePermission(PERM.FULFILLMENT),
	validateBody(orderStatusPatchSchema),
	updateOrderStatusController,
);
adminRouter.patch(
	'/orders/:id/items/:itemId/return',
	requirePermission(PERM.FULFILLMENT),
	validateBody(orderItemReturnSchema),
	partialReturnOrderItemController,
);
adminRouter.delete('/orders/:id', requireAdmin, deleteOrder);
adminRouter.get('/orders/:id', requirePermission(PERM.ORDERS), getOrderByIdAdmin);

adminRouter.get('/conversations', requirePermission(PERM.INBOX), listAdminSupportConversations);
adminRouter.get('/conversations/:id/messages', requirePermission(PERM.INBOX), listAdminMessages);
adminRouter.patch(
	'/conversations/:id/status',
	requirePermission(PERM.INBOX),
	validateBody(supportStatusPatchSchema),
	patchSupportConversationStatus,
);

export default adminRouter;
