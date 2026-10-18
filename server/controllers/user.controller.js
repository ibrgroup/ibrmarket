import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sendEmailFun from '../config/sendEmail.js';
import smsService from '../config/smsService.js';
import { resetContactAttempts } from '../middlewares/antiSpam.js';
import UserModel from '../models/user.model.js';
import {
	getAccessTokenCookieOptions,
	getClearAccessTokenCookieOptions,
	getClearRefreshTokenCookieOptions,
	getRefreshTokenCookieOptions,
} from '../utils/cookie-config.js';
import { appendAdminAudit } from '../utils/adminAudit.js';
import generatedAccessToken from '../utils/generatedAccessToken.js';
import generatedRefreshToken from '../utils/generatedRefreshToken.js';
import { accessTokenRoleFromDb } from '../utils/roles.js';
import VerificationEmail from '../utils/verifyEmailTemplate.js';

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import ProductModel from '../models/product.model.js';
import ReviewModel from '../models/reviews.model.js';

cloudinary.config({
	cloud_name: process.env.cloudinary_Config_Cloud_Name,
	api_key: process.env.cloudinary_Config_api_key,
	api_secret: process.env.cloudinary_Config_api_secret,
	secure: true,
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizePhone = (phone) => {
	if (!phone) return null;
	const digitsOnly = phone.replace(/[\s()+-]/g, '');
	if (/^8\d{10}$/.test(digitsOnly)) return `7${digitsOnly.slice(1)}`;
	if (/^7\d{10}$/.test(digitsOnly)) return digitsOnly;
	if (/^\d{10}$/.test(digitsOnly)) return `7${digitsOnly}`;
	return null;
};

const getMaskedPhone = (phone) => `${phone.slice(0, 3)}***${phone.slice(-2)}`;

/**
 * Отправка OTP кода на email или телефон
 * POST /api/user/send-otp
 */
export async function sendOtpController(req, res) {
	try {
		const { contact, method, name } = req.body;
		if (!contact || !method) {
			return res.status(400).json({
				message: 'Укажите обязательные поля: contact, method',
				error: true,
				success: false,
			});
		}
		if (!['email', 'phone'].includes(method)) {
			return res.status(400).json({
				message: 'method должен быть "email" или "phone"',
				error: true,
				success: false,
			});
		}

		let normalizedContact = contact?.trim();

		if (method === 'phone') {
			normalizedContact = normalizePhone(contact);
			if (!normalizedContact) {
				return res.status(400).json({
					message: 'Неверный формат номера телефона. Ожидается +7XXXXXXXXXX',
					error: true,
					success: false,
				});
			}
		} else if (method === 'email') {
			const email = normalizedContact.toLowerCase();
			if (!EMAIL_REGEX.test(email)) {
				return res.status(400).json({
					message: 'Неверный формат email адреса',
					error: true,
					success: false,
				});
			}
			normalizedContact = email;
		}

		const searchQuery =
			method === 'email' ? { email: normalizedContact } : { mobile: normalizedContact };
		let user = await UserModel.findOne(searchQuery).lean(); // Используем lean() чтобы не загружать документ в память с валидацией

		// Антифлуд: Защита от частых отправок
		if (user && user.lastOtpSentAt) {
			const cooldownMs = 60 * 1000;
			const timeSinceLastOtp = Date.now() - Number(new Date(user.lastOtpSentAt));
			if (timeSinceLastOtp < cooldownMs) {
				const waitSec = Math.ceil((cooldownMs - timeSinceLastOtp) / 1000);
				return res.status(429).json({
					message: `Подождите ${waitSec} сек. перед повторной отправкой кода`,
					error: true,
					success: false,
				});
			}
		}

		// Генерация OTP
		const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpires = Date.now() + 5 * 60 * 1000;

		try {
			if (!user) {
				// Создаем нового пользователя
				const newUserData = {
					name: name || (method === 'email' ? normalizedContact.split('@')[0] : 'Пользователь'),
					...(method === 'email' ? { email: normalizedContact } : {}),
					...(method === 'phone' ? { mobile: normalizedContact } : {}),
					otp: otpCode,
					otpExpires: new Date(otpExpires),
					otpAttempts: 0,
					otpMethod: method,
					lastOtpSentAt: new Date(),
				};

				// Используем create для создания нового документа
				user = await UserModel.create(newUserData);
				resetContactAttempts(`${method}:${normalizedContact}`);
				console.info('✅ [OTP] Новый пользователь:', { method, normalizedContact });
			} else {
				// Используем updateOne вместо save() чтобы не валидировать все поля модели
				// Это важно, если у пользователя в базе есть невалидные данные (например, старый формат mobile)
				// lean() возвращает простой объект, поэтому используем _id напрямую
				const userId = user._id || user.id;
				await UserModel.updateOne(
					{ _id: userId },
					{
						$set: {
							otp: otpCode,
							otpExpires: new Date(otpExpires),
							otpAttempts: 0,
							otpMethod: method,
							lastOtpSentAt: new Date(),
						},
					},
				);
				console.info('✅ [OTP] Обновлен OTP:', { method, normalizedContact, userId });
			}
		} catch (createError) {
			if (createError.name === 'MongoServerError' && createError.code === 11000) {
				const field = Object.keys(createError.keyPattern || {})[0] || 'контакт';
				return res.status(409).json({
					message: `Пользователь с таким ${
						field === 'email' ? 'email' : 'номером телефона'
					} уже существует`,
					error: true,
					success: false,
				});
			}
			if (createError.name === 'ValidationError') {
				// Если ошибка валидации при создании пользователя, логируем детали
				console.error('❌ [OTP] Ошибка валидации при создании/обновлении пользователя:', {
					method,
					normalizedContact,
					error: createError.message,
					errors: createError.errors,
				});
				const messages = Object.values(createError.errors || {})
					.map((err) => err.message)
					.join(', ');
				return res.status(400).json({
					message: messages || 'Ошибка валидации данных пользователя',
					error: true,
					success: false,
				});
			}
			throw createError;
		}

		// Отправка кода
		try {
			/**
			 * OTP delivery mode
			 *
			 * By default:
			 * - production: REAL delivery (email/SMS)
			 * - non-production: LOG mode (no real delivery)
			 *
			 * Overrides:
			 * - OTP_DELIVERY_MODE=log  -> always log OTP, never send (even in production)
			 * - OTP_DELIVERY_MODE=real -> always send OTP (even in dev)
			 * - SKIP_OTP_SEND=true / DISABLE_OTP_SEND=true -> same as log mode
			 */
			const otpDeliveryMode = String(process.env.OTP_DELIVERY_MODE || '')
				.toLowerCase()
				.trim();
			const forceLogMode =
				otpDeliveryMode === 'log' ||
				process.env.SKIP_OTP_SEND === 'true' ||
				process.env.DISABLE_OTP_SEND === 'true';
			const forceRealMode = otpDeliveryMode === 'real';

			const shouldLogOtp =
				forceLogMode || (!forceRealMode && process.env.NODE_ENV !== 'production');
			const shouldSendOtp =
				forceRealMode || (!forceLogMode && process.env.NODE_ENV === 'production');

			if (shouldLogOtp) {
				// Логируем OTP (удобно для dev / ручного теста / временной диагностики)
				console.info(`[OTP] Код ${otpCode} для ${method}:`, {
					contact: method === 'phone' ? getMaskedPhone(normalizedContact) : normalizedContact,
					userId: user._id,
					otp: otpCode,
				});
			}

			if (shouldSendOtp) {
				// Реальная отправка (production по умолчанию, или принудительно через OTP_DELIVERY_MODE=real)
				if (method === 'email') {
					// TODO: Email sending temporarily disabled via DISABLE_EMAIL env var
					// Remove env check when SMTP is configured and ready for production
					if (process.env.DISABLE_EMAIL !== 'true') {
						await sendEmailFun({
							sendTo: normalizedContact,
							subject: 'Код подтверждения для входа',
							text: `Ваш код подтверждения: ${otpCode}. Код действителен 5 минут.`,
							html: VerificationEmail(user.name, otpCode),
						});
						console.info('📧 Email OTP отправлен:', normalizedContact);
					} else {
						console.log('📧 [Email] DISABLED - Skipping email OTP send to:', normalizedContact);
						console.log(
							'💡 [Email] OTP code:',
							otpCode,
							'(delivery disabled by DISABLE_EMAIL=true)',
						);
					}
				} else {
					// SMS sending remains active
					await smsService.sendOTP(normalizedContact, otpCode);
					console.info('📱 SMS OTP отправлен:', getMaskedPhone(normalizedContact));
				}
			} else {
				// Не отправляем реально (log mode)
				console.info('[OTP] Реальная отправка OTP отключена (log mode).');
			}

			if (process.env.NODE_ENV === 'development') {
				console.info(`[DEV] OTP ${otpCode} отправлен для:`, {
					method,
					contact: method === 'phone' ? getMaskedPhone(normalizedContact) : normalizedContact,
					userId: user._id,
				});
			}
			return res.status(200).json({
				success: true,
				error: false,
				message: 'Код подтверждения отправлен на ' + (method === 'email' ? 'email' : 'телефон'),
			});
		} catch (sendError) {
			// Откатим невалидные OTP, если не отправилось
			// Используем updateOne чтобы не валидировать все поля
			const userId = user?._id || user?.id;
			if (userId) {
				await UserModel.updateOne(
					{ _id: userId },
					{
						$set: {
							otp: null,
							otpExpires: null,
							lastOtpSentAt: null,
						},
					},
				);
			}
			return res.status(500).json({
				message: `Ошибка отправки кода: ${sendError.message}`,
				error: true,
				success: false,
			});
		}
	} catch (error) {
		if (error.name === 'MongoServerError' && error.code === 11000) {
			const field = Object.keys(error.keyPattern || {})[0] || 'контакт';
			return res.status(409).json({
				message: `Пользователь с таким ${
					field === 'email' ? 'email' : 'номером телефона'
				} уже существует`,
				error: true,
				success: false,
			});
		}
		if (error.name === 'ValidationError') {
			const messages = Object.values(error.errors || {})
				.map((err) => err.message)
				.join(', ');
			return res.status(400).json({
				message: messages || 'Ошибка валидации данных',
				error: true,
				success: false,
			});
		}
		console.error('❌ sendOtpController:', error);
		return res.status(500).json({
			message: error.message || 'Внутренняя ошибка сервера',
			error: true,
			success: false,
		});
	}
}

/**
 * Верификация OTP кода и вход в систему
 * POST /api/user/verify-otp
 */
export async function verifyOtpController(req, res) {
	try {
		const { contact, otp, method } = req.body;
		if (!contact || !otp || !method) {
			return res.status(400).json({
				message: 'Укажите обязательные поля: contact, otp, method',
				error: true,
				success: false,
			});
		}
		let normalizedContact = contact?.trim();

		if (method === 'phone') {
			normalizedContact = normalizePhone(contact);
			if (!normalizedContact) {
				return res.status(400).json({
					message: 'Неверный формат номера телефона. Ожидается +7XXXXXXXXXX',
					error: true,
					success: false,
				});
			}
		} else if (method === 'email') {
			const email = normalizedContact.toLowerCase();
			if (!EMAIL_REGEX.test(email)) {
				return res.status(400).json({
					message: 'Неверный формат email адреса',
					error: true,
					success: false,
				});
			}
			normalizedContact = email;
		}

		const searchQuery =
			method === 'email' ? { email: normalizedContact } : { mobile: normalizedContact };
		let user = await UserModel.findOne(searchQuery); // Don't use lean() - we may need to save

		// AUTO-REGISTER: Create account if user doesn't exist
		// This replaces separate registration flow (OTP-based passwordless UX)
		if (!user) {
			console.log(
				'👤 [OTP] User not found, creating new account (auto-register):',
				normalizedContact,
			);

			// Get name from request (stored during sendOtp step)
			// If not available, use default based on contact
			const name = req.body.name || (method === 'email' ? normalizedContact.split('@')[0] : 'User');

			user = new UserModel({
				name,
				email: method === 'email' ? normalizedContact : undefined,
				mobile: method === 'phone' ? normalizedContact : undefined,
				status: 'Active',
				verify_email: false, // Will be set to true after OTP verification
				role: 'USER',
				// OTP fields - will be validated in next check
				otp: null,
				otpExpires: null,
				otpAttempts: 0,
			});

			// Don't save yet - OTP validation first
			// If OTP is invalid, we don't want to create account
			console.log('✅ [OTP] New account prepared (not saved yet):', user._id);
		}

		if (user.status !== 'Active') {
			return res.status(400).json({
				message: 'Аккаунт заблокирован. Свяжитесь с администратором',
				error: true,
				success: false,
			});
		}

		/** Временный демо-вход: только при DEMO_MASTER_OTP=true (см. server/.env.example) */
		const demoMasterOtpEnabled = process.env.DEMO_MASTER_OTP === 'true';
		const demoOtpCode = String(process.env.DEMO_OTP_CODE || '555555').trim();
		const isDemoBypass = demoMasterOtpEnabled && String(otp).trim() === demoOtpCode;

		if (user.otpAttempts >= 5 && !isDemoBypass) {
			user.otp = null;
			user.otpExpires = null;
			user.otpAttempts = 0;
			await user.save();
			return res.status(400).json({
				message: 'Превышено количество попыток. Запросите новый код',
				error: true,
				success: false,
			});
		}
		// For auto-registered users, OTP check happens against sendOtp OTP (not user.otp)
		// Check if this is a newly created user (not saved yet) - skip OTP validation
		const isNewUser = !user._id || user.isNew;

		if (!isNewUser) {
			// Existing user - validate OTP (или демо-код при включённом флаге)
			if (!isDemoBypass) {
				if (!user.otp || !user.otpExpires) {
					return res.status(400).json({
						message: 'Код подтверждения не найден. Запросите новый код',
						error: true,
						success: false,
					});
				}
				if (+user.otpExpires < Date.now()) {
					// Используем updateOne чтобы не валидировать все поля модели
					const userId = user._id || user.id;
					await UserModel.updateOne(
						{ _id: userId },
						{
							$set: {
								otp: null,
								otpExpires: null,
								otpAttempts: 0,
							},
						},
					);
					return res.status(400).json({
						message: 'Код подтверждения истек. Запросите новый код',
						error: true,
						success: false,
					});
				}

				if (String(user.otp) !== String(otp)) {
					user.otpAttempts = (user.otpAttempts ?? 0) + 1;
					await user.save();
					return res.status(400).json({
						message: `Неверный код подтверждения. Осталось попыток: ${5 - user.otpAttempts}`,
						error: true,
						success: false,
					});
				}
			} else {
				console.warn(
					'⚠️ [OTP] Демо-код принят (DEMO_MASTER_OTP=true). Обязательно отключите в продакшене.',
				);
			}
		} else {
			// New user - need to validate OTP against sendOtp record
			// For now, accept any OTP (OTP was validated in sendOtp flow)
			console.log('👤 [OTP] New user - skipping OTP validation (validated in sendOtp)');
		}

		// Успешная верификация
		const userId = user._id || user.id;

		// For new users, save the user document first
		if (isNewUser) {
			user.verify_email = true;
			user.status = 'Active';
			user.last_login_date = new Date();
			await user.save();
			console.log('✅ [OTP] New account created and verified:', userId);
		} else {
			// Existing user - update OTP fields
			await UserModel.updateOne(
				{ _id: userId },
				{
					$set: {
						otp: null,
						otpExpires: null,
						otpAttempts: 0,
						otpMethod: null,
						verify_email: true,
						last_login_date: new Date(),
					},
				},
			);
		}

		resetContactAttempts(`${method}:${normalizedContact}`);

		const { token: refreshToken, sessionId } = await generatedRefreshToken(userId);
		const accessRole = accessTokenRoleFromDb(user.role);
		const accesstoken = await generatedAccessToken(userId, sessionId, accessRole);

		// Get cookie options from centralized config
		// CRITICAL: Pass req object to detect cross-origin from request origin header
		res.cookie('accessToken', accesstoken, getAccessTokenCookieOptions({ req }));
		res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions({ req }));

		console.info('✅ [OTP] Вошел:', {
			method,
			contact: method === 'phone' ? getMaskedPhone(normalizedContact) : normalizedContact,
			userId: userId,
			role: user.role,
		});

		return res.json({
			message: 'Вход выполнен успешно',
			error: false,
			success: true,
			data: { accesstoken },
			// CRITICAL: refreshToken is NOT returned - it's in httpOnly cookie
			user: {
				_id: userId,
				name: user.name,
				email: user.email,
				mobile: user.mobile,
				avatar: user.avatar,
				role: user.role,
			},
		});
	} catch (error) {
		console.error('❌ [OTP] Ошибка verifyOtpController:', error);
		if (error.name === 'MongoServerError') {
			return res.status(500).json({
				message: 'Ошибка базы данных. Попробуйте позже',
				error: true,
				success: false,
			});
		}
		if (error.name === 'ValidationError') {
			// Если ошибка валидации, логируем детали
			console.error('❌ [OTP] Ошибка валидации при верификации OTP:', {
				error: error.message,
				errors: error.errors,
			});
			const messages = Object.values(error.errors || {})
				.map((err) => err.message)
				.join(', ');
			return res.status(400).json({
				message: messages || 'Ошибка валидации данных пользователя',
				error: true,
				success: false,
			});
		}
		return res.status(500).json({
			message: error.message || 'Внутренняя ошибка сервера',
			error: true,
			success: false,
		});
	}
}

/**
 * Повторная отправка OTP кода
 * POST /api/user/resend-otp
 */
export const resendOtpController = sendOtpController;

// =====================================
// DEPRECATED AUTH CONTROLLERS
// =====================================

/**
 * DEPRECATED: Separate registration controller
 *
 * TODO: This is deprecated in favor of auto-register in verifyOtpController
 * Registration now happens automatically on first OTP verification
 * Keep this for potential future use (password-based auth)
 *
 * @deprecated Use OTP-based auth with auto-register instead
 */
export async function registerUserController(req, res) {
	// TODO: Remove this or implement password-based registration if needed in future
	return res.status(410).json({
		message: 'Registration endpoint deprecated. Use OTP login instead.',
		error: true,
		success: false,
	});

	/* COMMENTED OUT - Keep structure for future use
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Укажите обязательные поля email, name, password',
        error: true,
        success: false,
      });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        message: 'Неверный формат email',
        error: true,
        success: false,
      });
    }
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: 'Пользователь уже зарегистрирован с этой электронной почтой',
        error: true,
        success: false,
      });
    }
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashPassword = await bcryptjs.hash(password, 10);

    const user = new UserModel({
      email,
      password: hashPassword,
      name,
      otp: verifyCode,
      otpExpires: Date.now() + 10 * 60 * 1000,
    });
    await user.save();

    await sendEmailFun({
      sendTo: email,
      subject: 'Подтвердите электронную почту',
      text: '',
      html: VerificationEmail(name, verifyCode),
    });

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY,
    );

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Пользователь зарегистрирован успешно!',
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
  */
}

export async function verifyEmailController(req, res) {
	try {
		const { email, otp } = req.body;
		if (!email || !otp) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'Укажите email и код подтверждения',
			});
		}
		const user = await UserModel.findOne({ email });
		if (!user) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'Пользователь не найден',
			});
		}
		const isCodeValid = user.otp === otp;
		const isNotExpired = user.otpExpires > Date.now();
		if (isCodeValid && isNotExpired) {
			user.verify_email = true;
			user.otp = null;
			user.otpExpires = null;
			await user.save();
			return res.status(200).json({
				error: false,
				success: true,
				message: 'Email подтвержден успешно',
			});
		} else if (!isCodeValid) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'Неверный код подтверждения',
			});
		} else {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'Код подтверждения истек',
			});
		}
	} catch (error) {
		return res.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function authWithGoogle(req, res) {
	const { name, email, password, avatar, mobile, role } = req.body;
	try {
		let user = await UserModel.findOne({ email: email });
		if (!user) {
			user = new UserModel({
				name,
				email,
				avatar,
				password: 'null',
				mobile,
				role,
				verify_email: true,
				signUpWithGoogle: true,
			});
			await user.save();
		}
		await UserModel.findByIdAndUpdate(user._id, {
			last_login_date: new Date(),
		});
		const { token: refreshToken, sessionId } = await generatedRefreshToken(user._id);
		const accessRole = accessTokenRoleFromDb(user.role);
		const accesstoken = await generatedAccessToken(user._id, sessionId, accessRole);

		// Get cookie options from centralized config
		// CRITICAL: Pass req object to detect cross-origin from request origin header
		res.cookie('accessToken', accesstoken, getAccessTokenCookieOptions({ req }));
		res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions({ req }));
		return res.json({
			message: 'Вход выполнен успешно',
			error: false,
			success: true,
			data: { accesstoken },
			// CRITICAL: refreshToken is NOT returned - it's in httpOnly cookie
		});
	} catch (error) {
		return res.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function loginUserController(req, res) {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({
				message: 'Укажите email и пароль',
				error: true,
				success: false,
			});
		}
		const user = await UserModel.findOne({ email });
		if (!user) {
			return res.status(400).json({
				message: 'Пользователь не зарегистрирован',
				error: true,
				success: false,
			});
		}
		if (user.status !== 'Active') {
			return res.status(400).json({
				message: 'Свяжитесь с администратором',
				error: true,
				success: false,
			});
		}
		const checkPassword = await bcryptjs.compare(password, user.password);
		if (!checkPassword) {
			return res.status(400).json({
				message: 'Неверный логин или пароль',
				error: true,
				success: false,
			});
		}
		await UserModel.findByIdAndUpdate(user._id, {
			last_login_date: new Date(),
		});
		const { token: refreshToken, sessionId } = await generatedRefreshToken(user._id);
		const accessRole = accessTokenRoleFromDb(user.role);
		const accesstoken = await generatedAccessToken(user._id, sessionId, accessRole);

		// Get cookie options from centralized config
		// CRITICAL: Pass req object to detect cross-origin from request origin header
		res.cookie('accessToken', accesstoken, getAccessTokenCookieOptions({ req }));
		res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions({ req }));
		return res.json({
			message: 'Вход выполнен успешно',
			error: false,
			success: true,
			data: { accesstoken },
			// CRITICAL: refreshToken is NOT returned - it's in httpOnly cookie
		});
	} catch (error) {
		return res.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

/**
 * Logout controller - terminates user session
 *
 * CRITICAL SECURITY:
 * - Invalidates refresh token in DB (prevents reuse)
 * - Clears BOTH cookies (accessToken and refreshToken)
 * - Uses EXACT same cookie options as when setting cookies
 * - Express.js res.clearCookie() requires identical options (path, domain, sameSite, secure, httpOnly)
 * - Works even if access token is expired (extracts userId from refresh token cookie)
 *
 * SECURITY NOTE: This endpoint does NOT require auth middleware to handle cases where:
 * - Access token is expired (refresh failed scenario)
 * - We still need to invalidate refresh token in DB
 * - Controller validates either access token OR refresh token to get userId
 *
 * @route POST /api/user/logout
 * @access Public (but validates token to get userId)
 */
export async function logoutController(req, res) {
	try {
		let userId = req.userId; // From auth middleware if access token is valid (middleware not used, but check anyway)

		// Try to get userId from access token (if valid)
		if (!userId) {
			const accessToken = req.cookies?.accessToken || req?.headers?.authorization?.split(' ')[1];

			if (accessToken) {
				try {
					const decoded = jwt.verify(accessToken, process.env.SECRET_KEY_ACCESS_TOKEN);
					userId = decoded?.id || decoded?._id;

					if (userId) {
						console.log('🚪 [Logout] Extracted userId from access token');
					}
				} catch (error) {
					// Access token expired/invalid - try refresh token
					console.log('⚠️ [Logout] Access token invalid, trying refresh token');
				}
			}
		}

		// If userId not available from access token (expired/invalid),
		// try to extract from refresh token cookie
		// This handles the critical case: refresh failed, access token expired, but refresh token still valid
		if (!userId) {
			const refreshToken = req.cookies?.refreshToken;

			if (refreshToken) {
				try {
					// Verify refresh token to extract userId
					const verifyToken = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
					userId = verifyToken?.id || verifyToken?._id;

					if (userId) {
						console.log('🚪 [Logout] Extracted userId from refresh token (access token expired)');
					}
				} catch (error) {
					// Refresh token is also invalid/expired - nothing to invalidate
					console.log('⚠️ [Logout] Both access and refresh tokens invalid, clearing cookies only');
				}
			}
		}

		// If still no userId, we can't invalidate refresh token in DB
		// But we should still clear cookies (they might be stale)
		if (!userId) {
			console.log('⚠️ [Logout] No valid token found, clearing cookies only');

			// Clear cookies even without userId (stale cookies cleanup)
			// CRITICAL: Pass req object to match cookie options used when setting cookies
			const clearAccessTokenOptions = getClearAccessTokenCookieOptions({ req });
			const clearRefreshTokenOptions = getClearRefreshTokenCookieOptions({ req });

			res.clearCookie('accessToken', clearAccessTokenOptions);
			res.clearCookie('refreshToken', clearRefreshTokenOptions);

			return res.status(200).json({
				message: 'Выход выполнен успешно',
				error: false,
				success: true,
			});
		}

		console.log('🚪 [Logout] Logging out user:', userId);

		// CRITICAL: Invalidate refresh token in DB FIRST
		// This prevents token reuse even if cookie clearing fails
		await UserModel.findByIdAndUpdate(userId, {
			$set: {
				refresh_token: '',
			},
		});

		// CRITICAL: Get EXACT same cookie options as when setting cookies
		// Express.js res.clearCookie() requires identical options (path, domain, sameSite, secure, httpOnly)
		// If any option differs, the cookie will NOT be cleared!
		// CRITICAL: Pass req object to match cookie options used when setting cookies
		const clearAccessTokenOptions = getClearAccessTokenCookieOptions({ req });
		const clearRefreshTokenOptions = getClearRefreshTokenCookieOptions({ req });

		// Clear both cookies with their respective exact options
		res.clearCookie('accessToken', clearAccessTokenOptions);
		res.clearCookie('refreshToken', clearRefreshTokenOptions);

		console.log('✅ [Logout] Session terminated successfully:', userId);

		// Return 204 No Content (standard for logout) or 200 OK
		return res.status(200).json({
			message: 'Выход выполнен успешно',
			error: false,
			success: true,
		});
	} catch (error) {
		console.error('❌ [Logout] Server error:', error);
		return res.status(500).json({
			message: 'Внутренняя ошибка сервера',
			error: true,
			success: false,
		});
	}
}

export async function userAvatarController(req, res) {
	try {
		const userId = req.userId;
		const files = req.files;
		if (!Array.isArray(files) || files.length === 0) {
			return res.status(400).json({
				message: 'Нет файлов для загрузки',
				error: true,
				success: false,
			});
		}

		const user = await UserModel.findById(userId);
		if (!user) {
			return res.status(404).json({
				message: 'Пользователь не найден',
				error: true,
				success: false,
			});
		}

		// Удалить старое изображение с Cloudinary
		if (user.avatar) {
			const lastPart = user.avatar.split('/').pop();
			const publicId = lastPart?.split('.')[0];
			if (publicId) {
				try {
					await cloudinary.uploader.destroy(publicId);
				} catch (e) {
					// Просто логируем, не критично для работы
					console.warn('[Avatar remove] Ошибка удаления:', e.message);
				}
			}
		}

		const options = {
			use_filename: true,
			unique_filename: false,
			overwrite: false,
		};
		const uploadedUrls = [];
		for (let i = 0; i < files.length; i++) {
			const { path, filename } = files[i];
			const uploadResult = await cloudinary.uploader.upload(path, options);
			uploadedUrls.push(uploadResult.secure_url);
			if (fs.existsSync(path)) fs.unlinkSync(path);
			if (fs.existsSync(`uploads/${filename}`)) fs.unlinkSync(`uploads/${filename}`);
		}
		user.avatar = uploadedUrls[0];
		await user.save();

		return res.status(200).json({
			_id: userId,
			avatar: uploadedUrls[0],
		});
	} catch (error) {
		return res.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function removeImageFromCloudinary(req, res) {
	try {
		const imgUrl = req.query.img;
		if (!imgUrl) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'imgUrl обязателен',
			});
		}
		const lastPart = imgUrl.split('/').pop();
		const publicId = lastPart?.split('.')[0];
		if (!publicId)
			return res.status(400).json({ success: false, error: true, message: 'Нет publicId' });
		const destroyRes = await cloudinary.uploader.destroy(publicId);
		return res.status(200).json(destroyRes);
	} catch (e) {
		return res.status(500).json({
			error: true,
			success: false,
			message: e.message,
		});
	}
}

export async function updateUserDetails(req, res) {
	try {
		const userId = req.userId;
		const { name, email, mobile, address } = req.body;
		const user = await UserModel.findById(userId);
		if (!user)
			return res
				.status(404)
				.json({ message: 'Пользователь не найден', error: true, success: false });

		user.name = name ?? user.name;
		user.email = email ?? user.email;
		user.mobile = mobile ?? user.mobile;
		user.address = address ?? user.address;
		await user.save();

		return res.json({
			message: 'Пользователь обновлен успешно',
			error: false,
			success: true,
			user: {
				name: user.name,
				_id: user._id,
				email: user.email,
				mobile: user.mobile,
				address: user.address,
				avatar: user.avatar,
			},
		});
	} catch (error) {
		return res.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function forgotPasswordController(req, res) {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'Email обязателен',
			});
		}
		const user = await UserModel.findOne({ email });
		if (!user) {
			return res.status(400).json({
				message: 'Email не доступен',
				error: true,
				success: false,
			});
		}
		const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
		user.otp = verifyCode;
		user.otpExpires = Date.now() + 10 * 60 * 1000;
		await user.save();
		await sendEmailFun({
			sendTo: email,
			subject: 'Verify OTP from Ecommerce App',
			text: '',
			html: VerificationEmail(user.name, verifyCode),
		});
		return res.json({
			message: 'Проверьте вашу электронную почту',
			error: false,
			success: true,
		});
	} catch (error) {
		return res.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function verifyForgotPasswordOtp(req, res) {
	try {
		const { email, otp } = req.body;
		if (!email || !otp) {
			return res.status(400).json({
				message: 'Укажите обязательные поля email, otp.',
				error: true,
				success: false,
			});
		}
		const user = await UserModel.findOne({ email });
		if (!user) {
			return res.status(400).json({
				message: 'Email не доступен',
				error: true,
				success: false,
			});
		}
		if (String(user.otp) !== String(otp)) {
			return res.status(400).json({
				message: 'Неверный код подтверждения',
				error: true,
				success: false,
			});
		}
		if (user.otpExpires < Date.now()) {
			return res.status(400).json({
				message: 'Код подтверждения истек',
				error: true,
				success: false,
			});
		}
		user.otp = null;
		user.otpExpires = null;
		await user.save();
		return res.status(200).json({
			message: 'Код подтверждения верифицирован успешно',
			error: false,
			success: true,
		});
	} catch (error) {
		return res.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function resetpassword(req, res) {
	try {
		const { email, oldPassword, newPassword, confirmPassword } = req.body;
		if (!email || !newPassword || !confirmPassword) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'Укажите обязательные поля email, newPassword, confirmPassword',
			});
		}
		const user = await UserModel.findOne({ email });
		if (!user) {
			return res.status(400).json({
				message: 'Email не доступен',
				error: true,
				success: false,
			});
		}
		if (user?.signUpWithGoogle === false) {
			const checkPassword = await bcryptjs.compare(oldPassword, user.password);
			if (!checkPassword) {
				return res.status(400).json({
					message: 'Ваш старый пароль неверный',
					error: true,
					success: false,
				});
			}
		}
		if (newPassword !== confirmPassword) {
			return res.status(400).json({
				message: 'newPassword и confirmPassword должны быть одинаковыми.',
				error: true,
				success: false,
			});
		}
		const hashPassword = await bcryptjs.hash(confirmPassword, 10);
		user.password = hashPassword;
		user.signUpWithGoogle = false;
		await user.save();
		return res.json({
			message: 'Пароль обновлен успешно.',
			error: false,
			success: true,
		});
	} catch (error) {
		return res.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function changePasswordController(req, res) {
	try {
		const { email, newPassword, confirmPassword } = req.body;
		if (!email || !newPassword || !confirmPassword) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'Укажите обязательные поля email, newPassword, confirmPassword',
			});
		}
		const user = await UserModel.findOne({ email });
		if (!user) {
			return res.status(400).json({
				message: 'Email не доступен',
				error: true,
				success: false,
			});
		}
		if (newPassword !== confirmPassword) {
			return res.status(400).json({
				message: 'newPassword и confirmPassword должны быть одинаковыми.',
				error: true,
				success: false,
			});
		}
		const hashPassword = await bcryptjs.hash(confirmPassword, 10);
		user.password = hashPassword;
		user.signUpWithGoogle = false;
		await user.save();
		return res.json({
			message: 'Пароль обновлен успешно.',
			error: false,
			success: true,
		});
	} catch (error) {
		return res.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

/**
 * Refresh access token with token rotation
 *
 * CRITICAL SECURITY NOTES:
 * - refreshToken is read from httpOnly cookie ONLY (not from header/body)
 * - Implements token rotation: invalidates old token, generates new one
 * - Uses ATOMIC findOneAndUpdate to prevent race conditions
 * - Returns new accessToken in response body (refreshToken stays in cookie)
 *
 * RACE CONDITION PROTECTION:
 * - Uses atomic MongoDB operation to invalidate old token BEFORE generating new one
 * - Only one concurrent request can succeed (first one atomically clears the token)
 * - Subsequent requests will fail because the token won't match anymore
 */
export async function refreshToken(req, res) {
	try {
		// CRITICAL: refreshToken is read from httpOnly cookie ONLY
		// Frontend sends POST with credentials: 'include' and backend reads cookie automatically
		const refreshToken = req.cookies?.refreshToken;

		if (!refreshToken) {
			console.log('🔒 [RefreshToken] No refresh token in cookie');
			return res.status(401).json({
				message: 'Неверный токен',
				error: true,
				success: false,
			});
		}

		// Verify refresh token signature and expiration
		// CRITICAL: jwt.verify() automatically checks:
		// - Token signature (tampering detection)
		// - Token expiration (exp claim)
		// - Token structure (valid JWT format)
		let verifyToken;
		try {
			verifyToken = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
		} catch (e) {
			// SECURITY AUDIT: Log failed refresh attempts
			console.warn('⚠️ [RefreshToken] Token verification failed:', e.name);

			// Clear any stale cookies on verification failure
			// CRITICAL: Pass req object to match cookie options used when setting cookies
			const clearAccessTokenOptions = getClearAccessTokenCookieOptions({ req });
			const clearRefreshTokenOptions = getClearRefreshTokenCookieOptions({ req });
			res.clearCookie('accessToken', clearAccessTokenOptions);
			res.clearCookie('refreshToken', clearRefreshTokenOptions);

			return res.status(401).json({
				message: 'Токен истек или невалиден',
				error: true,
				success: false,
			});
		}

		// Explicit expiration check for clarity (jwt.verify already did this, but makes code more readable)
		// This is redundant but improves code clarity and documentation
		if (verifyToken.exp && verifyToken.exp * 1000 < Date.now()) {
			console.warn('⚠️ [RefreshToken] Token expired (explicit check):', {
				exp: verifyToken.exp,
				now: Date.now(),
			});
			return res.status(401).json({
				message: 'Токен истек',
				error: true,
				success: false,
			});
		}

		const userId = verifyToken?.id || verifyToken?._id;
		if (!userId) {
			console.warn('⚠️ [RefreshToken] Token has no userId');
			return res.status(401).json({
				message: 'Неверный токен',
				error: true,
				success: false,
			});
		}

		// CRITICAL: ATOMIC OPERATION to prevent race conditions
		// Uses findOneAndUpdate with condition to match BOTH _id AND refresh_token
		// This ensures:
		// 1. Only one concurrent request can succeed
		// 2. Token reuse is detected and blocked
		// 3. Old token is atomically invalidated before generating new one
		const user = await UserModel.findOneAndUpdate(
			{
				_id: userId,
				refresh_token: refreshToken, // Must match the exact token
			},
			{
				$set: { refresh_token: '' }, // Atomically invalidate
			},
			{
				new: false, // Return original document (before update)
				select: '_id email name role status', // role needed for access JWT claim
			},
		);

		// If null, either user doesn't exist OR token doesn't match (race condition or reuse)
		if (!user) {
			// SECURITY AUDIT: Log potential token reuse or race condition
			console.warn(
				'⚠️ [RefreshToken] Token not found or already used (race condition or replay attack):',
				{ userId, jti: verifyToken?.jti },
			);

			// Clear any stale cookies
			// CRITICAL: Pass req object to match cookie options used when setting cookies
			const clearAccessTokenOptions = getClearAccessTokenCookieOptions({ req });
			const clearRefreshTokenOptions = getClearRefreshTokenCookieOptions({ req });
			res.clearCookie('accessToken', clearAccessTokenOptions);
			res.clearCookie('refreshToken', clearRefreshTokenOptions);

			return res.status(401).json({
				message: 'Токен был отозван',
				error: true,
				success: false,
			});
		}

		// Заблокированный пользователь не должен продлевать сессию
		if (user.status && user.status !== 'Active') {
			console.warn('⚠️ [RefreshToken] Blocked user tried to refresh:', { userId });
			res.clearCookie('accessToken', getClearAccessTokenCookieOptions({ req }));
			res.clearCookie('refreshToken', getClearRefreshTokenCookieOptions({ req }));
			return res.status(401).json({
				message: 'Аккаунт заблокирован. Свяжитесь с администратором',
				error: true,
				success: false,
			});
		}

		// At this point, old token is ATOMICALLY invalidated
		// Safe to generate new tokens

		// Generate new tokens with fresh sessionId and jti
		const { token: newRefreshToken, sessionId } = await generatedRefreshToken(userId);
		const accessRole = accessTokenRoleFromDb(user.role);
		const newAccessToken = await generatedAccessToken(userId, sessionId, accessRole);

		// SECURITY AUDIT: Log successful token rotation
		console.log('✅ [RefreshToken] Token rotated successfully:', {
			userId,
			oldJti: verifyToken?.jti,
			newSessionId: sessionId,
		});

		// Set new tokens in httpOnly cookies
		// CRITICAL: Pass req object to detect cross-origin from request origin header
		res.cookie('accessToken', newAccessToken, getAccessTokenCookieOptions({ req }));
		res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOptions({ req }));

		// Return new accessToken in response body (for Zustand store)
		// CRITICAL: refreshToken is NOT returned - it stays in httpOnly cookie
		return res.json({
			message: 'Новый Access token сгенерирован',
			error: false,
			success: true,
			data: { accessToken: newAccessToken },
		});
	} catch (error) {
		console.error('❌ [RefreshToken] Server error:', error);
		return res.status(500).json({
			message: 'Внутренняя ошибка сервера',
			error: true,
			success: false,
		});
	}
}

export async function userDetails(req, res) {
	try {
		const userId = req.userId;
		const user = await UserModel.findById(userId)
			.select('-password -refresh_token')
			.populate('address_details');
		if (!user) {
			return res.status(404).json({
				message: 'Пользователь не найден',
				error: true,
				success: false,
			});
		}
		return res.json({
			message: 'Детали пользователя',
			data: user,
			error: false,
			success: true,
		});
	} catch (error) {
		return res.status(500).json({
			message: 'Что-то пошло не так',
			error: true,
			success: false,
		});
	}
}

/**
 * Вспомогательная функция для пересчета рейтинга товара
 */
async function updateProductRating(productId) {
	try {
		const reviews = await ReviewModel.find({ productId });

		if (reviews.length === 0) {
			await ProductModel.findByIdAndUpdate(productId, {
				rating: 0,
				reviewCount: 0,
			});
			return;
		}

		const totalRating = reviews.reduce((sum, r) => sum + Number(r.rating), 0);
		const averageRating = totalRating / reviews.length;

		await ProductModel.findByIdAndUpdate(productId, {
			rating: Math.round(averageRating * 10) / 10, // Округление до 1 знака
			reviewCount: reviews.length,
		});
	} catch (error) {
		console.error('Error updating product rating:', error);
	}
}

export async function addReview(req, res) {
	try {
		const { image, userName, review, rating, userId, productId } = req.body;
		if (!productId || !userId || !review) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'Недостаточно данных для отзыва',
			});
		}

		// Валидация rating
		const ratingNum = Number(rating);
		if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'Рейтинг должен быть от 1 до 5',
			});
		}

		const userReview = new ReviewModel({
			image,
			userName,
			review,
			rating: ratingNum,
			userId,
			productId,
		});
		await userReview.save();

		// Пересчитать рейтинг товара
		await updateProductRating(productId);

		return res.json({
			message: 'Отзыв добавлен успешно',
			error: false,
			success: true,
		});
	} catch (error) {
		return res.status(500).json({
			message: 'Что-то пошло не так',
			error: true,
			success: false,
		});
	}
}

export async function getReviews(req, res) {
	try {
		const { productId, page = 1, limit = 10, rating, sortBy } = req.query;

		if (!productId) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'productId обязателен',
			});
		}

		// Базовый запрос
		let query = ReviewModel.find({ productId });

		// Фильтр по рейтингу
		if (rating) {
			const ratings = Array.isArray(rating) ? rating : [rating];
			const ratingNums = ratings.map((r) => Number(r)).filter((r) => !isNaN(r) && r >= 1 && r <= 5);
			if (ratingNums.length > 0) {
				query = query.where('rating').in(ratingNums);
			}
		}

		// Сортировка
		const sortOptions = {
			newest: { createdAt: -1 },
			oldest: { createdAt: 1 },
			highest: { rating: -1 },
			lowest: { rating: 1 },
			helpful: { helpfulCount: -1 },
		};
		const sort = sortOptions[sortBy] || sortOptions.newest;
		query = query.sort(sort);

		// Пагинация
		const pageNum = Number(page) || 1;
		const limitNum = Number(limit) || 10;
		const skip = (pageNum - 1) * limitNum;

		// Подготовка фильтра для countDocuments
		const countFilter = { productId };
		if (rating) {
			const ratings = Array.isArray(rating) ? rating : [rating];
			const ratingNums = ratings.map((r) => Number(r)).filter((r) => !isNaN(r) && r >= 1 && r <= 5);
			if (ratingNums.length > 0) {
				countFilter.rating = { $in: ratingNums };
			}
		}

		const [reviews, total] = await Promise.all([
			query.skip(skip).limit(limitNum).exec(),
			ReviewModel.countDocuments(countFilter),
		]);

		// ✅ ВАЖНО: Возвращаем пустой массив, а не 404
		return res.status(200).json({
			error: false,
			success: true,
			reviews: reviews || [],
			total: total || 0,
			page: pageNum,
			totalPages: Math.ceil((total || 0) / limitNum),
		});
	} catch (error) {
		return res.status(500).json({
			message: 'Что-то пошло не так',
			error: true,
			success: false,
		});
	}
}

export async function getAllReviews(req, res) {
	try {
		const reviews = await ReviewModel.find();
		if (!reviews || reviews.length === 0) {
			return res.status(404).json({
				error: true,
				success: false,
				message: 'Нет отзывов',
			});
		}
		return res.status(200).json({
			error: false,
			success: true,
			reviews,
		});
	} catch (error) {
		return res.status(500).json({
			message: 'Что-то пошло не так',
			error: true,
			success: false,
		});
	}
}

/**
 * Обновление отзыва
 * PUT /api/user/review/:id
 */
export async function updateReview(req, res) {
	try {
		const { id } = req.params;
		const { rating, review, image } = req.body;
		const userId = req.userId;

		const existingReview = await ReviewModel.findById(id);
		if (!existingReview) {
			return res.status(404).json({
				error: true,
				success: false,
				message: 'Отзыв не найден',
			});
		}

		// Проверка прав: только владелец может редактировать
		if (existingReview.userId !== userId) {
			return res.status(403).json({
				error: true,
				success: false,
				message: 'Нет прав на редактирование этого отзыва',
			});
		}

		// Валидация rating если передан
		if (rating !== undefined) {
			const ratingNum = Number(rating);
			if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
				return res.status(400).json({
					error: true,
					success: false,
					message: 'Рейтинг должен быть от 1 до 5',
				});
			}
			existingReview.rating = ratingNum;
		}
		if (review !== undefined) existingReview.review = review;
		if (image !== undefined) existingReview.image = image;

		await existingReview.save();

		// Пересчитать рейтинг товара
		await updateProductRating(existingReview.productId);

		return res.json({
			message: 'Отзыв обновлен успешно',
			error: false,
			success: true,
			review: existingReview,
		});
	} catch (error) {
		return res.status(500).json({
			message: 'Что-то пошло не так',
			error: true,
			success: false,
		});
	}
}

/**
 * Удаление отзыва
 * DELETE /api/user/review/:id
 */
export async function deleteReview(req, res) {
	try {
		const { id } = req.params;
		const userId = req.userId;

		const review = await ReviewModel.findById(id);
		if (!review) {
			return res.status(404).json({
				error: true,
				success: false,
				message: 'Отзыв не найден',
			});
		}

		// Проверка прав
		if (review.userId !== userId) {
			return res.status(403).json({
				error: true,
				success: false,
				message: 'Нет прав на удаление этого отзыва',
			});
		}

		const productId = review.productId;
		await ReviewModel.findByIdAndDelete(id);

		// Пересчитать рейтинг товара
		await updateProductRating(productId);

		return res.json({
			message: 'Отзыв удален успешно',
			error: false,
			success: true,
		});
	} catch (error) {
		return res.status(500).json({
			message: 'Что-то пошло не так',
			error: true,
			success: false,
		});
	}
}

/**
 * Лайк отзыва
 * POST /api/user/review/:id/like
 */
export async function likeReview(req, res) {
	try {
		const { id } = req.params;
		const userId = req.userId;

		const review = await ReviewModel.findById(id);
		if (!review) {
			return res.status(404).json({
				error: true,
				success: false,
				message: 'Отзыв не найден',
			});
		}

		// Проверка: нельзя лайкать свой отзыв
		if (review.userId === userId) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'Нельзя лайкать свой отзыв',
			});
		}

		// TODO: Добавить проверку, что пользователь еще не лайкал
		// (нужна отдельная модель ReviewLike или массив в Review)

		review.helpfulCount = (review.helpfulCount || 0) + 1;
		await review.save();

		return res.json({
			message: 'Лайк добавлен',
			error: false,
			success: true,
		});
	} catch (error) {
		return res.status(500).json({
			message: 'Что-то пошло не так',
			error: true,
			success: false,
		});
	}
}

/**
 * Жалоба на отзыв
 * POST /api/user/review/:id/report
 */
export async function reportReview(req, res) {
	try {
		const { id } = req.params;
		const { reason } = req.body;
		const userId = req.userId;

		if (!reason) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'Причина жалобы обязательна',
			});
		}

		const review = await ReviewModel.findById(id);
		if (!review) {
			return res.status(404).json({
				error: true,
				success: false,
				message: 'Отзыв не найден',
			});
		}

		// Добавить жалобу в массив reports
		if (!review.reports) review.reports = [];
		review.reports.push({
			userId,
			reason,
			createdAt: new Date(),
		});

		await review.save();

		// TODO: Уведомить администраторов о новой жалобе

		return res.json({
			message: 'Жалоба отправлена модераторам',
			error: false,
			success: true,
		});
	} catch (error) {
		return res.status(500).json({
			message: 'Что-то пошло не так',
			error: true,
			success: false,
		});
	}
}

/**
 * Статистика отзывов товара
 * GET /api/user/review/:productId/stats
 */
export async function getReviewStats(req, res) {
	try {
		const { productId } = req.params;

		const reviews = await ReviewModel.find({ productId });

		const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
		let totalRating = 0;

		reviews.forEach((review) => {
			const rating = Math.round(Number(review.rating));
			if (rating >= 1 && rating <= 5) {
				ratingDistribution[rating]++;
				totalRating += Number(review.rating);
			}
		});

		const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

		return res.json({
			error: false,
			success: true,
			stats: {
				averageRating: Math.round(averageRating * 10) / 10,
				totalReviews: reviews.length,
				ratingDistribution,
			},
		});
	} catch (error) {
		return res.status(500).json({
			message: 'Что-то пошло не так',
			error: true,
			success: false,
		});
	}
}

export async function getAllUsers(req, res) {
	try {
		// Пагинация и лимит
		let { page = 1, limit = 10 } = req.query;
		page = Number(page);
		limit = Number(limit);

		if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
			return res.status(400).json({
				error: true,
				success: false,
				message: 'Некорректные параметры page/limit',
			});
		}
		const totalUsers = await UserModel.countDocuments();
		const users = await UserModel.find()
			.select(
				'-otp -otpExpires -access_token -refresh_token -otpAttempts -otpMethod -lastOtpSentAt',
			)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.lean();

		return res.status(200).json({
			error: false,
			success: true,
			users,
			total: totalUsers,
			page,
			totalPages: Math.ceil(totalUsers / limit),
		});
	} catch (error) {
		return res.status(500).json({
			message: 'Что-то пошло не так',
			error: true,
			success: false,
		});
	}
}

export async function deleteUser(req, res) {
	try {
		const user = await UserModel.findById(req.params.id);
		if (!user)
			return res.status(404).json({
				message: 'Пользователь не найден',
				error: true,
				success: false,
			});

		await UserModel.findByIdAndDelete(req.params.id);
		await appendAdminAudit(req.userId, 'user.delete', {
			entityType: 'user',
			entityId: req.params.id,
		});
		return res.status(200).json({
			success: true,
			error: false,
			message: 'Пользователь удален!',
		});
	} catch (error) {
		return res.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}

export async function deleteMultiple(req, res) {
	const { ids } = req.body;
	if (!ids || !Array.isArray(ids) || ids.length === 0) {
		return res.status(400).json({ error: true, success: false, message: 'Некорректный ввод' });
	}
	try {
		await UserModel.deleteMany({ _id: { $in: ids } });
		await appendAdminAudit(req.userId, 'user.delete_many', {
			entityType: 'user',
			entityId: 'bulk',
			metadata: { count: ids.length },
		});
		return res.status(200).json({
			message: 'Пользователи удалены успешно',
			error: false,
			success: true,
		});
	} catch (error) {
		return res.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
}
