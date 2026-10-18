import UserModel from '../models/user.model.js';
import { isStaffRole } from '../utils/roles.js';

/**
 * После `auth` — пользователь существует и имеет одну из ролей персонала (STAFF_ROLES).
 */
const requireStaff = async (request, response, next) => {
	try {
		if (!request.userId) {
			return response.status(401).json({
				message: 'Unauthorized',
				error: true,
				success: false,
			});
		}

		const user = await UserModel.findById(request.userId).select('role').lean();
		if (!user || !isStaffRole(user.role)) {
			return response.status(403).json({
				message: 'Forbidden: staff only',
				error: true,
				success: false,
			});
		}

		request.userRole = user.role;
		next();
	} catch (error) {
		console.error('❌ [requireStaff]', error);
		return response.status(500).json({
			message: 'Internal server error',
			error: true,
			success: false,
		});
	}
};

export default requireStaff;
