import mongoose from 'mongoose';
import UserModel from '../models/user.model.js';

function mapMethodToClient(m) {
	const o = m.toObject ? m.toObject() : m;
	return {
		id: String(o._id),
		type: o.type || 'card',
		paymentMethodId: o.paymentMethodId,
		lastFour: o.lastFour || '',
		brand: o.brand || 'unknown',
		expiryMonth: typeof o.expiryMonth === 'number' ? o.expiryMonth : 0,
		expiryYear: typeof o.expiryYear === 'number' ? o.expiryYear : 0,
		isDefault: Boolean(o.isDefault),
		isVerified: true,
		createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
	};
}

function resolveTargetUserId(request) {
	if (request.internalCall) {
		return request.body?.userId || request.query?.userId;
	}
	return request.userId;
}

/**
 * GET /api/payment/methods?userId= — internal + userId
 * GET /api/payment/methods — JWT
 */
export const getPaymentMethodsController = async (request, response) => {
	try {
		let userId = request.internalCall ? request.query.userId : request.userId;
		if (request.internalCall && !userId) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'userId is required',
			});
		}
		if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid userId',
			});
		}

		const user = await UserModel.findById(userId).select('paymentMethods').lean();
		if (!user) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'User not found',
			});
		}

		const list = (user.paymentMethods || []).map((m) =>
			mapMethodToClient({
				...m,
				_id: m._id,
			}),
		);

		return response.status(200).json({
			error: false,
			success: true,
			data: list,
		});
	} catch (error) {
		console.error('[paymentMethods] GET error:', error);
		return response.status(500).json({
			error: true,
			success: false,
			message: error.message || 'Server error',
		});
	}
};

/**
 * POST /api/payment/methods — internal (save-card) или пользователь
 */
export const addPaymentMethodController = async (request, response) => {
	try {
		const userId = resolveTargetUserId(request);
		if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'userId is required',
			});
		}

		if (
			!request.internalCall &&
			request.body?.userId &&
			String(request.body.userId) !== String(userId)
		) {
			return response.status(403).json({
				error: true,
				success: false,
				message: 'userId mismatch',
			});
		}

		const {
			paymentMethodId,
			type = 'card',
			lastFour = '',
			brand = 'unknown',
			expiryMonth = 0,
			expiryYear = 0,
			isDefault = false,
		} = request.body;

		if (!paymentMethodId || typeof paymentMethodId !== 'string') {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'paymentMethodId is required',
			});
		}

		const user = await UserModel.findById(userId);
		if (!user) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'User not found',
			});
		}

		if (!user.paymentMethods) {
			user.paymentMethods = [];
		}

		const digits = String(lastFour || '').replace(/\D/g, '');
		const lastFourNorm = digits.length >= 4 ? digits.slice(-4) : String(lastFour || '');

		const idx = user.paymentMethods.findIndex((m) => m.paymentMethodId === paymentMethodId);
		if (idx >= 0) {
			const doc = user.paymentMethods[idx];
			doc.type = type;
			doc.lastFour = lastFourNorm;
			doc.brand = String(brand).toLowerCase();
			doc.expiryMonth = Number(expiryMonth) || 0;
			doc.expiryYear = Number(expiryYear) || 0;
			if (isDefault) {
				user.paymentMethods.forEach((m) => {
					m.isDefault = false;
				});
				doc.isDefault = true;
			}
		} else {
			const makeDefault = Boolean(isDefault) || user.paymentMethods.length === 0;
			if (makeDefault) {
				user.paymentMethods.forEach((m) => {
					m.isDefault = false;
				});
			}
			user.paymentMethods.push({
				paymentMethodId,
				type,
				lastFour: lastFourNorm,
				brand: String(brand).toLowerCase(),
				expiryMonth: Number(expiryMonth) || 0,
				expiryYear: Number(expiryYear) || 0,
				isDefault: makeDefault,
				createdAt: new Date(),
			});
		}

		await user.save();
		const saved = user.paymentMethods.find((m) => m.paymentMethodId === paymentMethodId);
		const data = mapMethodToClient(saved);

		return response.status(201).json({
			error: false,
			success: true,
			data,
		});
	} catch (error) {
		console.error('[paymentMethods] POST error:', error);
		return response.status(500).json({
			error: true,
			success: false,
			message: error.message || 'Server error',
		});
	}
};

export const deletePaymentMethodController = async (request, response) => {
	try {
		const userId = request.userId;
		const { id } = request.params;
		if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid method id',
			});
		}

		const user = await UserModel.findById(userId);
		if (!user) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'User not found',
			});
		}

		const sub = user.paymentMethods.id(id);
		if (!sub) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'Payment method not found',
			});
		}

		const wasDefault = Boolean(sub.isDefault);
		sub.deleteOne();

		if (wasDefault && user.paymentMethods.length > 0) {
			user.paymentMethods.forEach((m) => {
				m.isDefault = false;
			});
			user.paymentMethods[0].isDefault = true;
		}

		await user.save();

		return response.status(200).json({
			error: false,
			success: true,
			data: undefined,
		});
	} catch (error) {
		console.error('[paymentMethods] DELETE error:', error);
		return response.status(500).json({
			error: true,
			success: false,
			message: error.message || 'Server error',
		});
	}
};

export const setDefaultPaymentMethodController = async (request, response) => {
	try {
		const userId = request.userId;
		const { id } = request.params;
		if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
			return response.status(400).json({
				error: true,
				success: false,
				message: 'Invalid method id',
			});
		}

		const user = await UserModel.findById(userId);
		if (!user) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'User not found',
			});
		}

		const method = (user.paymentMethods || []).find((m) => String(m._id) === String(id));
		if (!method) {
			return response.status(404).json({
				error: true,
				success: false,
				message: 'Payment method not found',
			});
		}

		user.paymentMethods.forEach((m) => {
			m.isDefault = false;
		});
		method.isDefault = true;
		await user.save();

		return response.status(200).json({
			error: false,
			success: true,
			data: mapMethodToClient(method),
		});
	} catch (error) {
		console.error('[paymentMethods] PUT default error:', error);
		return response.status(500).json({
			error: true,
			success: false,
			message: error.message || 'Server error',
		});
	}
};
