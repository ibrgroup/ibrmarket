/**
 * Express middleware: проверка req.body через Zod-схему.
 * При успехе подменяет req.body на результат parse (coercion; неизвестные поля — см. .passthrough() на схеме).
 *
 * @param {import('zod').ZodType} schema
 */
export function validateBody(schema) {
	return (req, res, next) => {
		const result = schema.safeParse(req.body ?? {});
		if (!result.success) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'Validation failed',
				details: result.error.flatten(),
			});
		}
		req.body = result.data;
		next();
	};
}
