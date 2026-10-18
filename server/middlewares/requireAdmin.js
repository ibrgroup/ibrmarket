import UserModel from '../models/user.model.js';
import { isSuperAdminRole } from '../utils/roles.js';

/**
 * После `auth` (и при необходимости requireStaff) — только роль ADMIN.
 */
const requireAdmin = async (request, response, next) => {
	try {
		if (!request.userId) {
			return response.status(401).json({
				message: 'Unauthorized',
				error: true,
				success: false,
			});
		}

		const user = await UserModel.findById(request.userId).select('role').lean();
		if (!user || !isSuperAdminRole(user.role)) {
			return response.status(403).json({
				message: 'Forbidden: administrator only',
				error: true,
				success: false,
			});
		}

		request.userRole = user.role;
		next();
	} catch (error) {
		console.error('❌ [requireAdmin]', error);
		return response.status(500).json({
			message: 'Internal server error',
			error: true,
			success: false,
		});
	}
};

export default requireAdmin;
