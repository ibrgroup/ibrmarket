import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model.js';

/**
 * Authentication middleware for protected routes
 *
 * CRITICAL SECURITY NOTES:
 * - Verifies JWT signature (backend is source of truth)
 * - Supports both cookie-based (accessToken) and header-based (Authorization) auth
 * - Proper error handling: 401 for unauthorized, 500 for server errors
 * - Logs security events for audit
 */
const auth = async (request, response, next) => {
  try {
    // Get token from cookie (primary) or Authorization header (fallback for mobile/API)
    const token =
      request.cookies.accessToken || request?.headers?.authorization?.split(' ')[1];

    if (!token) {
      return response.status(401).json({
        message: 'Provide token',
        error: true,
        success: false,
      });
    }

    // Verify token signature
    let decoded;
    try {
      decoded = await jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
    } catch (jwtError) {
      // JWT verification errors (expired, invalid signature, etc.)
      if (jwtError.name === 'TokenExpiredError') {
        return response.status(401).json({
          message: 'Token expired',
          error: true,
          success: false,
        });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return response.status(401).json({
          message: 'Invalid token',
          error: true,
          success: false,
        });
      }
      // Other JWT errors
      throw jwtError;
    }

    if (!decoded || !decoded.id) {
      return response.status(401).json({
        message: 'Unauthorized access',
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findById(decoded.id).select('status').lean();
    if (!user) {
      return response.status(401).json({
        message: 'Unauthorized access',
        error: true,
        success: false,
      });
    }

    if (user.status && user.status !== 'Active') {
      return response.status(403).json({
        message: 'Аккаунт заблокирован. Свяжитесь с администратором',
        error: true,
        success: false,
      });
    }

    // Attach userId to request for use in controllers
    request.userId = decoded.id;

    // Log successful authentication (for audit)
    if (process.env.NODE_ENV === 'development') {
      console.info('✅ [Auth] Authenticated request:', {
        userId: decoded.id,
        path: request.path,
        method: request.method,
      });
    }

    next();
  } catch (error) {
    // Server errors (not JWT errors - those are handled above)
    console.error('❌ [Auth] Server error in auth middleware:', error);
    return response.status(500).json({
      message: 'Internal server error',
      error: true,
      success: false,
    });
  }
};

export default auth;