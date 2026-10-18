import path from 'path';
import { fileURLToPath } from 'url';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import connectDB from './config/connectDb.js';
import { checkDatabaseConnection } from './middlewares/dbCheck.js';
import addressRouter from './route/address.route.js';
import bannerList2Router from './route/bannerList2.route.js';
import bannerV1Router from './route/bannerV1.route.js';
import blogRouter from './route/blog.route.js';
import cartRouter from './route/cart.route.js';
import conversationRouter from './route/conversation.route.js';
import categoryRouter from './route/category.route.js';
import homeSlidesRouter from './route/homeSlides.route.js';
import logoRouter from './route/logo.route.js';
import notificationRouter from './route/notification.route.js';
import notificationAnalyticsRouter from './route/notificationAnalytics.route.js';
import adminRouter from './route/admin.route.js';
import orderRouter from './route/order.route.js';
import paymentMethodsRouter from './route/paymentMethods.route.js';
import paymentRouter from './route/payment.route.js';
import paymentUserRouter from './route/paymentUser.route.js';
import productRouter from './route/product.route.js';
import userRouter from './route/user.route.js';
import wishlistRouter from './route/wishlist.route.js';
import { validateAllCookieOptions } from './utils/cookie-config.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ----------- Swagger Setup -----------
const swaggerOptions = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'IBR-Server API',
			version: '1.0.0',
			description:
				'Документация API для IBR-Server (Express Backend). Скачать OpenAPI: /docs/openapi.json?download=1',
		},
		servers: [
			{
				url: `http://localhost:${process.env.PORT || 8000}`,
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					description: 'JWT из заголовка Authorization: Bearer <token>',
				},
				cookieAuth: {
					type: 'apiKey',
					in: 'cookie',
					name: 'accessToken',
					description: 'JWT в cookie accessToken (или Authorization: Bearer)',
				},
			},
		},
	},
	apis: [path.join(__dirname, 'route', '*.js'), path.join(__dirname, 'models', '*.js')],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// OpenAPI JSON: просмотр и скачивание (GET /docs/openapi.json, ?download=1 — скачать файл)
app.get('/docs/openapi.json', (req, res) => {
	res.set('Content-Type', 'application/json');
	if (req.query.download === '1') {
		res.set('Content-Disposition', 'attachment; filename="openapi.json"');
	}
	res.send(JSON.stringify(swaggerSpec, null, 2));
});

app.use(
	'/docs',
	swaggerUi.serve,
	swaggerUi.setup(swaggerSpec, {
		swaggerOptions: {
			persistAuthorization: true,
			displayRequestDuration: true,
		},
	}),
);
// -------------------------------------

// CORS configuration
const corsOptions = {
	origin: function (origin, callback) {
		// Разрешаем запросы без origin (например, Postman, мобильные приложения)
		if (!origin) return callback(null, true);

		// Разрешенные домены
		const allowedOrigins = [
			'http://localhost:3000',
			'http://localhost:3001',
			process.env.FRONTEND_URL,
			process.env.NEXT_PUBLIC_API_URL?.replace('/api', ''),
		].filter(Boolean); // Убираем undefined значения

		// В development разрешаем все (для удобства разработки)
		if (process.env.NODE_ENV === 'development') {
			return callback(null, true);
		}

		// В production проверяем список разрешенных доменов
		if (
			allowedOrigins.includes(origin) ||
			allowedOrigins.some((allowed) => origin?.includes(allowed))
		) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	},
	credentials: true,
	optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
// app.use(morgan())
app.use(
	helmet({
		crossOriginResourcePolicy: false,
	}),
);

app.get('/', (request, response) => {
	///server to client
	response.json({
		message: 'Server is running ' + process.env.PORT,
	});
});

// Применяем проверку подключения к БД для всех API роутов
app.use('/api', checkDatabaseConnection);

app.use('/api/user', userRouter);
app.use('/api/category', categoryRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/address', addressRouter);
app.use('/api/homeSlides', homeSlidesRouter);
app.use('/api/bannerV1', bannerV1Router);
app.use('/api/bannerList2', bannerList2Router);
app.use('/api/blog', blogRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/order', orderRouter);
app.use('/api/payment/methods', paymentMethodsRouter);
app.use('/api/payment/yookassa', paymentRouter);
app.use('/api/payment', paymentUserRouter);
app.use('/api/logo', logoRouter);
app.use('/api/notification', notificationRouter);
app.use('/api/notification-analytics', notificationAnalyticsRouter);

// Подключаемся к БД и запускаем сервер только после успешного подключения
connectDB()
	.then((connected) => {
		if (connected) {
			// CRITICAL: Validate cookie configuration on startup
			// This catches configuration errors early before they cause silent logout failures
			const cookieConfigValid = validateAllCookieOptions();
			if (!cookieConfigValid) {
				console.error('❌ [Startup] Cookie configuration validation FAILED');
				console.error('   Server will start, but logout may fail silently!');
				console.error('   Please fix cookie configuration before production deployment.');
			}

			const port = process.env.PORT || 8000;
			app.listen(port, '0.0.0.0', () => {
				console.log(`Server is running on port ${port}`);
				console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
				console.log(
					`Swagger docs: http://localhost:${port}/docs | OpenAPI JSON: http://localhost:${port}/docs/openapi.json`,
				);
			});
		} else {
			console.error('❌ Server not started due to database connection failure');
			console.error('⚠️ Please fix the MongoDB connection issue and restart the server');
			// Даем время на чтение ошибки перед завершением
			setTimeout(() => {
				process.exit(1);
			}, 5000);
		}
	})
	.catch((error) => {
		console.error('❌ Failed to start server:', error);
		process.exit(1);
	});

/**
 * Как добавить описание Swagger к роуту (например, для userRouter):
 *
 * // В начале файла route/user.route.js:
 * /**
 *  * @swagger
 *  * /api/user:
 *  *   get:
 *  *     summary: Получить список пользователей
 *  *     responses:
 *  *       200:
 *  *         description: Успешный ответ
 *  *         content:
 *  *           application/json:
 *  *             schema:
 *  *               type: array
 *  *               items:
 *  *                 $ref: '#/components/schemas/User'
 *  *\/
 * app.get('/api/user', ...);
 *
 * // И не забудьте добавить описание компонентов (схем) в swaggerOptions либо через JSDoc в файлах!
 */
