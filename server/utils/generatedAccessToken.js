import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ALL_USER_ROLES } from './roles.js';

const VALID_ROLES = new Set(ALL_USER_ROLES);

/**
 * Generate access token with jti (JWT ID) for session management
 * @param {string} userId - User ID
 * @param {string|null} sessionId - Optional session ID (for linking to refresh token)
 * @param {string|null} role - Роль из БД; встраивается для same-origin SSR gates
 * @returns {Promise<string>} JWT access token
 */
const generatedAccessToken = async (userId, sessionId = null, role = null) => {
	const jti = crypto.randomBytes(16).toString('hex');

	const payload = {
		id: userId,
		jti,
	};

	if (sessionId) {
		payload.sessionId = sessionId;
	}

	if (role && VALID_ROLES.has(String(role).toUpperCase())) {
		payload.role = String(role).toUpperCase();
	}

	const token = await jwt.sign(payload, process.env.SECRET_KEY_ACCESS_TOKEN, {
		expiresIn: '24h',
	});

	return token;
};

export default generatedAccessToken;
