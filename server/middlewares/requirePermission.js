import UserModel from '../models/user.model.js';
import { can } from '../utils/permissions.js';
import { isStaffRole } from '../utils/roles.js';

/**
 * После `auth`. Проверяет, что пользователь — персонал и имеет указанное право.
 * @param {string} permission — значение из PERM (permissions.js)
 */
export default function requirePermission(permission) {
	return async (request, response, next) => {
		try {
			if (!request.userId) {
				return response.status(401).json({
					message: 'Unauthorized',
					error: true,
					success: false,
				});
			}

			let role = request.userRole;
			if (!role) {
				const user = await UserModel.findById(request.userId).select('role').lean();
				role = user?.role;
			}

			if (!isStaffRole(role)) {
				return response.status(403).json({
					message: 'Forbidden: staff only',
					error: true,
					success: false,
				});
			}

			if (!can(role, permission)) {
				return response.status(403).json({
					message: 'Forbidden: insufficient permissions',
					error: true,
					success: false,
				});
			}

			request.userRole = role;
			next();
		} catch (error) {
			console.error('❌ [requirePermission]', error);
			return response.status(500).json({
				message: 'Internal server error',
				error: true,
				success: false,
			});
		}
	};
}
