import auth from './auth.js';

/**
 * Либо X-Internal-Api-Key (вызов с Next / внутренних сервисов), либо JWT (браузер).
 * Устанавливает req.internalCall = true при валидном internal key.
 */
const allowInternalOrAuth = async (request, response, next) => {
	const expected = process.env.INTERNAL_API_KEY;
	const got = request.headers['x-internal-api-key'];
	if (expected && got && got === expected) {
		request.internalCall = true;
		return next();
	}
	return auth(request, response, next);
};

export default allowInternalOrAuth;
