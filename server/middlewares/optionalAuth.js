import jwt from 'jsonwebtoken';

/**
 * При валидном токене выставляет request.userId; иначе пропускает без ошибки.
 * Синхронная проверка JWT (как в основном auth), без 401.
 */
const optionalAuth = (request, response, next) => {
	try {
		const token = request.cookies?.accessToken || request?.headers?.authorization?.split(' ')[1];
		if (!token) {
			return next();
		}
		const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
		if (decoded?.id) {
			request.userId = decoded.id;
		}
	} catch {
		// гость или просроченный токен — не блокируем запрос
	}
	next();
};

export default optionalAuth;
