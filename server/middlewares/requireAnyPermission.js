import UserModel from '../models/user.model.js';
import { can } from '../utils/permissions.js';
import { isStaffRole } from '../utils/roles.js';

/**
 * После `auth`. Персонал с хотя бы одним из перечисленных прав.
 * @param {string[]} permissions
 */
export default function requireAnyPermission(permissions) {
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

			const list = Array.isArray(permissions) ? permissions : [];
			if (!list.some((p) => can(role, p))) {
				return response.status(403).json({
					message: 'Forbidden: insufficient permissions',
					error: true,
					success: false,
				});
			}

			request.userRole = role;
			next();
		} catch (error) {
			console.error('❌ [requireAnyPermission]', error);
			return response.status(500).json({
				message: 'Internal server error',
				error: true,
				success: false,
			});
		}
	};
}
