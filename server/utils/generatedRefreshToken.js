import UserModel from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generate refresh token with jti and sessionId for session management
 * Stores token in DB for validation and rotation
 * @param {string} userId - User ID
 * @returns {Promise<{token: string, sessionId: string}>} Refresh token and session ID
 */
const generatedRefreshToken = async (userId) => {
  // Generate unique session ID for this refresh token
  const sessionId = crypto.randomBytes(16).toString('hex');
  // Generate unique JWT ID (jti) for this token
  const jti = crypto.randomBytes(16).toString('hex');

  const token = await jwt.sign(
    {
      id: userId,
      _id: userId, // Backward compatibility
      jti: jti, // JWT ID for token revocation/audit
      sessionId: sessionId, // Session ID for session management
    },
    process.env.SECRET_KEY_REFRESH_TOKEN,
    { expiresIn: '60d' }, // 60 дней
  );

  // Store refresh token in DB for validation and rotation
  const updateRefreshTokenUser = await UserModel.updateOne(
    { _id: userId },
    {
      refresh_token: token,
      // Store session metadata (optional, for future session management UI)
      // last_refresh_token_updated: new Date(),
    },
  );

  return { token, sessionId };
};

export default generatedRefreshToken;
