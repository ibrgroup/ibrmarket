import UserModel from '../models/user.model.js';

/**
 * After `auth` — loads role for routes that need "self OR admin" (e.g. order by id).
 */
const loadUserRole = async (request, response, next) => {
  try {
    if (!request.userId) {
      request.userRole = undefined;
      return next();
    }
    const user = await UserModel.findById(request.userId).select('role').lean();
    request.userRole = user?.role || 'USER';
    next();
  } catch (error) {
    console.error('❌ [loadUserRole]', error);
    return response.status(500).json({
      message: 'Internal server error',
      error: true,
      success: false,
    });
  }
};

export default loadUserRole;
