import { Router } from 'express';
import {
	addReview,
	// authWithGoogle, // disabled RF compliance
	deleteMultiple,
	deleteReview,
	deleteUser,
	getAllReviews,
	getAllUsers,
	getReviewStats,
	getReviews,
	likeReview,
	logoutController,
	refreshToken,
	removeImageFromCloudinary,
	reportReview,
	resendOtpController,
	sendOtpController,
	updateReview,
	updateUserDetails,
	userAvatarController,
	userDetails,
	verifyOtpController,
} from '../controllers/user.controller.js';
import { antiSpamMiddleware } from '../middlewares/antiSpam.js';
import auth from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import requirePermission from '../middlewares/requirePermission.js';
import { PERM } from '../utils/permissions.js';
import upload from '../middlewares/multer.js';
import {
	refreshTokenLimiter,
	resendOtpLimiter,
	sendOtpLimiter,
	verifyOtpLimiter,
} from '../middlewares/rateLimiter.js';

const userRouter = Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Пользователи, регистрация, OTP, профиль, отзывы, токены, Google OAuth и др.
 */

/**
 * @swagger
 * /api/user/send-otp:
 *   post:
 *     summary: Запросить OTP (Email или Телефон) для входа/регистрации
 *     description: >
 *       Генерирует и отправляет OTP (email или phone) пользователю. Используется для регистрации и входа.
 *       <br>Включает защиту от спама и rate limiting.
 *     tags: [User]
 *     requestBody:
 *       description: Email или российский телефон + способ (email|phone)
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ivan@mail.ru
 *               mobile:
 *                 type: string
 *                 pattern: '^7\\d{10}$'
 *                 example: 79991234567
 *               method:
 *                 type: string
 *                 enum: [email, phone]
 *     responses:
 *       200:
 *         description: OTP успешно отправлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 expiresIn:
 *                   type: integer
 *       429:
 *         description: Превышен лимит запросов
 *       400:
 *         description: Неверные данные или нет email/телефона
 */
userRouter.post('/send-otp', sendOtpLimiter, antiSpamMiddleware, sendOtpController);

/**
 * @swagger
 * /api/user/verify-otp:
 *   post:
 *     summary: Верификация OTP кода (Email/Phone)
 *     description: >
 *       Проверяет введённый код OTP, возвращает access и refresh токены при успехе.<br>
 *       Создаёт пользователя или возвращает существующего.
 *     tags: [User]
 *     requestBody:
 *       description: Запрос с email/телефоном, кодом OTP и выбранным методом
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               mobile:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [email, phone]
 *               otp:
 *                 type: string
 *                 example: '530049'
 *     responses:
 *       200:
 *         description: OTP верифицирован, пользователь аутентифицирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Код неверен или истёк, ошибка валидации
 *       429:
 *         description: Превышен лимит попыток/запросов OTP
 */
userRouter.post('/verify-otp', verifyOtpLimiter, verifyOtpController);

/**
 * @swagger
 * /api/user/resend-otp:
 *   post:
 *     summary: Повторно отправить код OTP (email/phone)
 *     description: >
 *       Повторная отправка OTP пользователю.<br> Есть ограничения по времени и количеству попыток.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               mobile:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [email, phone]
 *     responses:
 *       200:
 *         description: OTP отправлен
 *       400:
 *         description: Ошибка валидации, превышен лимит отправки
 *       429:
 *         description: Превышен лимит повторных отправок
 */
userRouter.post('/resend-otp', resendOtpLimiter, resendOtpController);

// ============================================================
// OLD ROUTES (DEPRECATED - COMMENTED OUT)
// ============================================================
// userRouter.post('/register', registerUserController); // ❌ Replaced with OTP
// userRouter.post('/verifyEmail', verifyEmailController); // ❌ Replaced with verify-otp
// userRouter.post('/login', loginUserController); // ❌ Replaced with OTP
// userRouter.post('/forgot-password', forgotPasswordController); // ❌ No passwords
// userRouter.post('/verify-forgot-password-otp', verifyForgotPasswordOtp); // ❌ No passwords
// userRouter.post('/reset-password', resetpassword); // ❌ No passwords
// userRouter.post('/forgot-password/change-password', changePasswordController); // ❌ No passwords

/**
 * @swagger
 * /api/user/authWithGoogle:
 *   post:
 *     summary: Вход/регистрация через Google
 *     description: >
 *       Принимает Google OAuth credential (idToken), возвращает access/refresh токены и профиль пользователя.<br>
 *       Работает для новых и существующих пользователей.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               credential:
 *                 type: string
 *                 description: Google id_token
 *     responses:
 *       200:
 *         description: Аутентификация успешна
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка логина/валидации токена
 */
// Google auth disabled (RF compliance)
// userRouter.post('/authWithGoogle', authWithGoogle);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Разлогиниться (инвалидация токена)
 *     description: >
 *       Инвалидация текущих access/refresh токенов.<br>
 *       Можно вызвать без access token, если есть refresh token.
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Успешный логаут
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Неавторизован/токен не найден
 */
userRouter.post('/logout', logoutController);

/**
 * @swagger
 * /api/user/user-avatar:
 *   put:
 *     summary: Загрузить/обновить аватар пользователя
 *     description: >
 *       Загружает новый аватар (множественные файлы поддерживаются, только последний используется).<br>
 *       Требует авторизации.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Аватар обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatar:
 *                   type: string
 *       401:
 *         description: Неавторизован
 */
userRouter.put('/user-avatar', upload.array('avatar'), auth, userAvatarController);

/**
 * @swagger
 * /api/user/deteleImage:
 *   delete:
 *     summary: Удалить изображение пользователя (Cloudinary)
 *     description: >
 *       Удаление изображения пользователя по ссылке.<br>
 *       Требует авторизации.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: URL изображения на Cloudinary для удаления
 *     responses:
 *       200:
 *         description: Изображение удалено
 *       400:
 *         description: Ошибка запроса/удаления
 *       401:
 *         description: Неавторизован
 */
userRouter.delete('/deteleImage', auth, removeImageFromCloudinary);

/**
 * @swagger
 * /api/user/{id}:
 *   put:
 *     summary: Обновить профиль пользователя
 *     description: >
 *       Обновление данных пользователя (имя, email, телефон и др.).<br>
 *       Требует авторизации.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ID пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Данные пользователя обновлены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 */
userRouter.put('/:id', auth, updateUserDetails);

/**
 * @swagger
 * /api/user/refresh-token:
 *   post:
 *     summary: Обновить access/refresh токен
 *     description: >
 *       Возвращает новые access/refresh токены по действующему refresh токену.<br>
 *       Защищено rate limiting.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Токены обновлены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *       400:
 *         description: Некорректный или истекший refresh токен
 *       429:
 *         description: Превышен лимит обращений
 */
userRouter.post('/refresh-token', refreshTokenLimiter, refreshToken);

/**
 * @swagger
 * /api/user/user-details:
 *   get:
 *     summary: Получить детали пользователя (профиль)
 *     description: >
 *       Возвращает публичные и приватные данные пользователя. Требует авторизации.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Неавторизован
 */
userRouter.get('/user-details', auth, userDetails);

/**
 * @swagger
 * /api/user/addReview:
 *   post:
 *     summary: Оставить отзыв о товаре
 *     description: Добавляет новый отзыв о товаре. Требует авторизации.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID товара
 *               rating:
 *                 type: integer
 *                 description: Оценка (1-5)
 *               text:
 *                 type: string
 *                 description: Текст отзыва
 *     responses:
 *       200:
 *         description: Отзыв добавлен успешно
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 */
userRouter.post('/addReview', auth, addReview);

/**
 * @swagger
 * /api/user/getReviews:
 *   get:
 *     summary: Получить отзывы (постранично)
 *     description: Возвращает список отзывов пользователей, поддерживает пагинацию и фильтрацию.
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: ID товара (фильтрация)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Размер страницы
 *     responses:
 *       200:
 *         description: Список отзывов
 *       400:
 *         description: Ошибка параметров запроса
 */
userRouter.get('/getReviews', getReviews);

/**
 * @swagger
 * /api/user/getAllReviews:
 *   get:
 *     summary: Получить все отзывы
 *     description: >
 *       Возвращает список всех отзывов на платформе (админ-фича или общедоступно).
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Список всех отзывов
 */
userRouter.get('/getAllReviews', getAllReviews);

/**
 * @swagger
 * /api/user/review/{id}:
 *   put:
 *     summary: Редактировать отзыв
 *     description: Обновляет существующий отзыв по ID. Требует авторизации.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ID отзыва
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Отзыв обновлён
 *       400:
 *         description: Ошибка запроса
 *       401:
 *         description: Неавторизован
 */
userRouter.put('/review/:id', auth, updateReview);

/**
 * @swagger
 * /api/user/review/{id}:
 *   delete:
 *     summary: Удалить отзыв
 *     description: >
 *       Удаляет отзыв по его идентификатору. Требует авторизации.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID отзыва
 *     responses:
 *       200:
 *         description: Отзыв удалён
 *       401:
 *         description: Неавторизован
 */
userRouter.delete('/review/:id', auth, deleteReview);

/**
 * @swagger
 * /api/user/review/{id}/like:
 *   post:
 *     summary: Лайкнуть отзыв
 *     description: >
 *       Ставит или убирает лайк на отзыве указанного пользователя. Требует авторизации.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID отзыва
 *     responses:
 *       200:
 *         description: Cостояние лайка обновлено
 *       401:
 *         description: Неавторизован
 */
userRouter.post('/review/:id/like', auth, likeReview);

/**
 * @swagger
 * /api/user/review/{id}/report:
 *   post:
 *     summary: Пожаловаться на отзыв
 *     description: >
 *       Оставить жалобу на отзыв для модерации. Требует авторизации.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID отзыва
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Жалоба отправлена
 *       400:
 *         description: Ошибка запроса
 *       401:
 *         description: Неавторизован
 */
userRouter.post('/review/:id/report', auth, reportReview);

/**
 * @swagger
 * /api/user/review/{productId}/stats:
 *   get:
 *     summary: Получить статистику отзывов по продукту
 *     description: >
 *       Возвращает агрегированную статистику отзывов по продукту (средняя оценка, кол-во и т. д.)
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID товара
 *     responses:
 *       200:
 *         description: Возвращает объект статистики отзывов
 *       400:
 *         description: Ошибка параметров
 */
userRouter.get('/review/:productId/stats', getReviewStats);

/**
 * @swagger
 * /api/user/getAllUsers:
 *   get:
 *     summary: Получить всех пользователей
 *     description: >
 *       Возвращает полный список пользователей.<br> Только для админов!
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Массив пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Нет прав доступа
 */
userRouter.get('/getAllUsers', auth, requirePermission(PERM.USERS), getAllUsers);

/**
 * @swagger
 * /api/user/deleteMultiple:
 *   delete:
 *     summary: Удалить несколько пользователей
 *     description: >
 *       Массовое удаление пользователей (по массиву ID).<br> Только для админов!
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Список ID пользователей для удаления
 *     responses:
 *       200:
 *         description: Пользователи удалены
 *       403:
 *         description: Нет прав доступа
 */
userRouter.delete('/deleteMultiple', auth, requireAdmin, deleteMultiple);

/**
 * @swagger
 * /api/user/deleteUser/{id}:
 *   delete:
 *     summary: Удалить одного пользователя по ID
 *     description: >
 *       Удаление одного пользователя по ID.<br> Только для админов!
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID пользователя
 *     responses:
 *       200:
 *         description: Пользователь удалён
 *       403:
 *         description: Нет прав доступа
 */
userRouter.delete('/deleteUser/:id', auth, requireAdmin, deleteUser);

export default userRouter;

// ===== SWAGGER СХЕМА ПОЛЬЗОВАТЕЛЯ =====
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - status
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ID пользователя
 *         name:
 *           type: string
 *           description: Имя пользователя
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя (опционально)
 *         mobile:
 *           type: string
 *           description: Российский номер телефона (опционально, только формат 7XXXXXXXXXX)
 *         avatar:
 *           type: string
 *           description: URL аватара
 *         address:
 *           type: string
 *           description: Адрес (опционально)
 *         verify_email:
 *           type: boolean
 *           description: Был ли подтвержден email
 *         access_token:
 *           type: string
 *           description: Текущий access token (если есть)
 *         refresh_token:
 *           type: string
 *           description: Текущий refresh token (если есть)
 *         last_login_date:
 *           type: string
 *           format: date-time
 *           description: Последний вход (optional)
 *         status:
 *           type: string
 *           enum: [Active, Inactive, Suspended]
 *           description: Статус пользователя
 *         address_details:
 *           type: array
 *           items:
 *             type: string
 *           description: ID адресов
 *         orderHistory:
 *           type: array
 *           items:
 *             type: string
 *           description: ID заказов
 *         otp:
 *           type: string
 *           description: (internal) последний отп-код
 *         otpExpires:
 *           type: string
 *           format: date-time
 *           description: (internal) когда истекает otp
 *         otpAttempts:
 *           type: integer
 *           description: Количество попыток ввода otp
 *         otpMethod:
 *           type: string
 *           enum: [email, phone]
 *           description: Способ получения otp
 *         lastOtpSentAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего отп
 *         role:
 *           type: string
 *           enum: [USER, ADMIN, MODERATOR, SUPPORT, MANAGER, SELLER]
 *           description: Роль пользователя
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
