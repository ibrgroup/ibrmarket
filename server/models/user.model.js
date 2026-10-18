import mongoose from 'mongoose';

const userSchema = mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Provide name'],
		},
		email: {
			type: String,
			trim: true,
			lowercase: true,
			set: (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
		},
		mobile: {
			type: String,
			set: (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
			validate: {
				validator: function (v) {
					// Позволяем null, undefined, пустую строку (email-логин)
					if (!v || v === null || v === undefined || v === '') return true;
					// Валидируем только если значение не пустое
					return /^7\d{10}$/.test(String(v)); // Храним телефон в нормализованном виде 7XXXXXXXXXX
				},
				message: (props) =>
					`${props.value} не является действительным российским номером телефона!`,
			},
		},
		avatar: {
			type: String,
			default: '',
		},
		address: {
			type: String,
			default: '',
		},
		verify_email: {
			type: Boolean,
			default: false,
		},
		access_token: {
			type: String,
			default: '',
		},
		refresh_token: {
			type: String,
			default: '',
		},
		last_login_date: {
			type: Date,
			default: '',
		},
		status: {
			type: String,
			enum: ['Active', 'Inactive', 'Suspended'],
			default: 'Active',
		},
		address_details: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'address',
			},
		],
		orderHistory: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'order',
			},
		],
		// OTP поля для аутентификации без пароля
		otp: {
			type: String,
		},
		otpExpires: {
			type: Date,
		},
		otpAttempts: {
			type: Number,
			default: 0,
		},
		otpMethod: {
			type: String,
			enum: ['email', 'phone'],
		},
		lastOtpSentAt: {
			type: Date,
		},
		role: {
			type: String,
			enum: ['USER', 'ADMIN', 'MODERATOR', 'SUPPORT', 'MANAGER', 'SELLER'],
			default: 'USER',
		},
		/** Сохранённые способы оплаты ЮKassa (payment_method_id) */
		paymentMethods: [
			{
				paymentMethodId: { type: String, required: true },
				type: { type: String, default: 'card' },
				lastFour: { type: String, default: '' },
				brand: { type: String, default: '' },
				expiryMonth: { type: Number, default: 0 },
				expiryYear: { type: Number, default: 0 },
				isDefault: { type: Boolean, default: false },
				createdAt: { type: Date, default: Date.now },
			},
		],
		/** Настройки безопасности (раздел «Платежи» /settings) */
		paymentSecuritySettings: {
			twoFactorEnabled: { type: Boolean, default: false },
			notifications: {
				newLogins: { type: Boolean, default: true },
				paymentMethodChanges: { type: Boolean, default: true },
				suspiciousActivity: { type: Boolean, default: true },
			},
		},
	},
	{ timestamps: true },
);

// Уникальность применяется только к реальным значениям.
// Это предотвращает конфликт при phone-login, когда email отсутствует.
userSchema.index(
	{ email: 1 },
	{
		unique: true,
		partialFilterExpression: { email: { $exists: true, $type: 'string' } },
	},
);

userSchema.index(
	{ mobile: 1 },
	{
		unique: true,
		partialFilterExpression: { mobile: { $exists: true, $type: 'string' } },
	},
);

const UserModel = mongoose.model('User', userSchema);

export default UserModel;
