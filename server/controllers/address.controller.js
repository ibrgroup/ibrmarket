import mongoose from 'mongoose';
import AddressModel from '../models/address.model.js';
import UserModel from '../models/user.model.js';

import {
	ADDRESS_TYPES,
	DEFAULT_LIMIT,
	DEFAULT_PAGE,
	MAX_ADDRESSES,
	MAX_FIELD_LENGTHS,
	MAX_PAGINATION_LIMIT,
} from '../constants/address.constants.js';
import {
	isValidPincode,
	normalizeRussianMobile,
	parsePositiveInt,
	trimOptionalString,
	trimString,
} from '../utils/addressValidation.js';

/**
 * Helper: Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
	return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Helper: Handle errors consistently
 */
const handleError = (error, response) => {
	console.error('Address controller error:', error);

	// Mongoose validation errors
	if (error instanceof mongoose.Error.ValidationError) {
		return response.status(400).json({
			success: false,
			error: true,
			message: 'Validation error',
			errors: Object.values(error.errors).map((e) => e.message),
		});
	}

	// Invalid ObjectId
	if (error instanceof mongoose.Error.CastError) {
		return response.status(400).json({
			success: false,
			error: true,
			message: 'Invalid address ID format',
		});
	}

	// Generic error - don't expose internal details
	return response.status(500).json({
		success: false,
		error: true,
		message: 'Internal server error',
	});
};

/**
 * Helper: Standard success response
 */
const successResponse = (response, data, message, statusCode = 200) => {
	return response.status(statusCode).json({
		success: true,
		error: false,
		data,
		message,
	});
};

export const addAddressController = async (request, response) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		if (!request.userId) {
			await session.abortTransaction();
			return response.status(401).json({
				success: false,
				error: true,
				message: 'Unauthorized',
			});
		}
		const userId = request.userId; // From auth middleware, not from body!
		const {
			address_line1,
			city,
			state,
			pincode,
			country,
			mobile,
			landmark,
			addressType,
			selected,
		} = request.body;

		const addressLine1 = trimString(address_line1);
		const cityValue = trimString(city);
		const stateValue = trimString(state);
		const pincodeValue = trimString(pincode);
		const countryValue = trimString(country);
		const landmarkValue = trimOptionalString(landmark);

		// Basic validation (no empty strings)
		if (
			!addressLine1 ||
			!cityValue ||
			!stateValue ||
			!pincodeValue ||
			!countryValue ||
			mobile == null
		) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: 'Missing required fields: address_line1, city, state, pincode, country, mobile',
			});
		}

		// Length validation (match mongoose schema constraints)
		if (addressLine1.length > MAX_FIELD_LENGTHS.address_line1) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: `Address line 1 cannot exceed ${MAX_FIELD_LENGTHS.address_line1} characters`,
			});
		}
		if (cityValue.length > MAX_FIELD_LENGTHS.city) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: `City cannot exceed ${MAX_FIELD_LENGTHS.city} characters`,
			});
		}
		if (stateValue.length > MAX_FIELD_LENGTHS.state) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: `State cannot exceed ${MAX_FIELD_LENGTHS.state} characters`,
			});
		}
		if (countryValue.length > MAX_FIELD_LENGTHS.country) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: `Country cannot exceed ${MAX_FIELD_LENGTHS.country} characters`,
			});
		}
		if (typeof landmarkValue === 'string' && landmarkValue.length > MAX_FIELD_LENGTHS.landmark) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: `Landmark cannot exceed ${MAX_FIELD_LENGTHS.landmark} characters`,
			});
		}

		// Format validation
		if (!isValidPincode(pincodeValue)) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: 'Pincode must be 5-6 digits',
			});
		}

		const normalizedMobile = normalizeRussianMobile(mobile);
		if (!normalizedMobile) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: 'Mobile must be a valid Russian phone number (7XXXXXXXXXX)',
			});
		}

		// Validate addressType enum
		if (addressType && !ADDRESS_TYPES.includes(addressType)) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: 'Invalid addressType. Must be "Home" or "Office"',
			});
		}

		// Check if user exists and count addresses (early check for clear error)
		const user = await UserModel.findById(userId).select('address_details').session(session);
		if (!user) {
			await session.abortTransaction();
			return response.status(404).json({
				success: false,
				error: true,
				message: 'User not found',
			});
		}

		const currentCount = Array.isArray(user.address_details) ? user.address_details.length : 0;
		if (currentCount >= MAX_ADDRESSES) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: `Достигнут лимит: можно сохранить не более ${MAX_ADDRESSES} адресов. Удалите ненужный адрес в разделе «Мои адреса».`,
				code: 'MAX_ADDRESSES_REACHED',
				maxAddresses: MAX_ADDRESSES,
			});
		}

		const isFirstAddress = currentCount === 0;
		const shouldBeDefault = selected === true || isFirstAddress;

		// Create address
		const address = new AddressModel({
			address_line1: addressLine1,
			city: cityValue,
			state: stateValue,
			pincode: pincodeValue,
			country: countryValue,
			mobile: normalizedMobile,
			userId, // From middleware, secure
			landmark: landmarkValue,
			addressType,
			selected: shouldBeDefault,
		});

		const savedAddress = await address.save({ session });

		if (shouldBeDefault) {
			await AddressModel.updateMany(
				{ userId, _id: { $ne: savedAddress._id } },
				{ selected: false },
				{ session },
			);
		}

		// Update user's address_details
		const updateResult = await UserModel.updateOne(
			{
				_id: userId,
				// Atomic guard to prevent exceeding MAX_ADDRESSES in concurrent requests
				$expr: {
					$lt: [{ $size: { $ifNull: ['$address_details', []] } }, MAX_ADDRESSES],
				},
			},
			{
				$push: {
					address_details: savedAddress._id,
				},
			},
			{ session },
		);

		if (updateResult.matchedCount === 0 || updateResult.modifiedCount === 0) {
			// Either the user no longer matches (deleted) OR limit reached.
			// Rollback: remove created address inside the same transaction.
			await AddressModel.deleteOne({ _id: savedAddress._id }).session(session);
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: `Достигнут лимит: можно сохранить не более ${MAX_ADDRESSES} адресов. Удалите ненужный адрес в разделе «Мои адреса».`,
				code: 'MAX_ADDRESSES_REACHED',
				maxAddresses: MAX_ADDRESSES,
			});
		}

		await session.commitTransaction();

		console.log('[Address] Created:', { userId, addressId: savedAddress._id });
		return successResponse(response, savedAddress, 'Address created successfully', 201);
	} catch (error) {
		await session.abortTransaction();
		return handleError(error, response);
	} finally {
		if (session.inTransaction()) {
			await session.abortTransaction();
		}
		session.endSession();
	}
};

export const getAddressController = async (request, response) => {
	try {
		if (!request.userId) {
			return response.status(401).json({
				success: false,
				error: true,
				message: 'Unauthorized',
			});
		}
		const userId = request.userId; // From middleware, secure

		// Pagination
		const page = parsePositiveInt(request.query.page, DEFAULT_PAGE);
		const limit = Math.min(
			parsePositiveInt(request.query.limit, DEFAULT_LIMIT),
			MAX_PAGINATION_LIMIT,
		);
		const skip = (page - 1) * limit;

		// Get addresses with pagination
		const [addresses, total] = await Promise.all([
			AddressModel.find({ userId }).skip(skip).limit(limit).sort({ createdAt: -1 }),
			AddressModel.countDocuments({ userId }),
		]);

		// Empty array is valid - return empty array, not 404
		return successResponse(
			response,
			{
				addresses,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit),
				},
				maxAddresses: MAX_ADDRESSES,
			},
			'Addresses retrieved successfully',
		);
	} catch (error) {
		return handleError(error, response);
	}
};

export const deleteAddressController = async (request, response) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		if (!request.userId) {
			await session.abortTransaction();
			return response.status(401).json({
				success: false,
				error: true,
				message: 'Unauthorized',
			});
		}
		const userId = request.userId; // From middleware
		const _id = request.params.id;

		// Validate ObjectId
		if (!isValidObjectId(_id)) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: 'Invalid address ID format',
			});
		}

		// Delete address
		const deleteResult = await AddressModel.deleteOne({ _id, userId }).session(session);

		if (deleteResult.deletedCount === 0) {
			await session.abortTransaction();
			return response.status(404).json({
				success: false,
				error: true,
				message: 'Address not found',
			});
		}

		// Remove from user's address_details
		const userUpdateResult = await UserModel.updateOne(
			{ _id: userId },
			{ $pull: { address_details: _id } },
			{ session },
		);

		if (userUpdateResult.matchedCount === 0) {
			console.warn(`[Address] User ${userId} not found when removing address ${_id}`);
			// Не критично, так как адрес уже удален, но стоит залогировать
		}

		await session.commitTransaction();

		console.log(`[Address] Deleted address ${_id} for user ${userId}`);
		return successResponse(response, { id: _id }, 'Address deleted successfully');
	} catch (error) {
		await session.abortTransaction();
		return handleError(error, response);
	} finally {
		if (session.inTransaction()) {
			await session.abortTransaction();
		}
		session.endSession();
	}
};

export const getSingleAddressController = async (request, response) => {
	try {
		if (!request.userId) {
			return response.status(401).json({
				success: false,
				error: true,
				message: 'Unauthorized',
			});
		}
		const id = request.params.id;
		const userId = request.userId; // From middleware

		// Validate ObjectId
		if (!isValidObjectId(id)) {
			return response.status(400).json({
				success: false,
				error: true,
				message: 'Invalid address ID format',
			});
		}

		// Find address and verify ownership
		const address = await AddressModel.findOne({ _id: id, userId }).lean();

		if (!address) {
			return response.status(404).json({
				success: false,
				error: true,
				message: 'Address not found',
			});
		}

		return successResponse(response, address, 'Address retrieved successfully');
	} catch (error) {
		return handleError(error, response);
	}
};

export async function editAddress(request, response) {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		if (!request.userId) {
			await session.abortTransaction();
			return response.status(401).json({
				success: false,
				error: true,
				message: 'Unauthorized',
			});
		}
		const id = request.params.id;
		const userId = request.userId; // From middleware

		// Validate ObjectId
		if (!isValidObjectId(id)) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: 'Invalid address ID format',
			});
		}

		// Verify ownership
		const existingAddress = await AddressModel.findOne({ _id: id, userId }).session(session);
		if (!existingAddress) {
			await session.abortTransaction();
			return response.status(404).json({
				success: false,
				error: true,
				message: 'Address not found',
			});
		}

		const {
			address_line1,
			city,
			state,
			pincode,
			country,
			mobile,
			landmark,
			addressType,
			selected,
		} = request.body;

		// Trim and validate provided fields (empty strings + length in one pass)
		const addressLine1Value =
			typeof address_line1 === 'string' ? address_line1.trim() : address_line1;
		if (typeof addressLine1Value === 'string') {
			if (addressLine1Value === '') {
				await session.abortTransaction();
				return response.status(400).json({
					success: false,
					error: true,
					message: 'address_line1 cannot be empty',
				});
			}
			if (addressLine1Value.length > MAX_FIELD_LENGTHS.address_line1) {
				await session.abortTransaction();
				return response.status(400).json({
					success: false,
					error: true,
					message: `Address line 1 cannot exceed ${MAX_FIELD_LENGTHS.address_line1} characters`,
				});
			}
		}

		const cityValue = typeof city === 'string' ? city.trim() : city;
		if (typeof cityValue === 'string') {
			if (cityValue === '') {
				await session.abortTransaction();
				return response.status(400).json({
					success: false,
					error: true,
					message: 'city cannot be empty',
				});
			}
			if (cityValue.length > MAX_FIELD_LENGTHS.city) {
				await session.abortTransaction();
				return response.status(400).json({
					success: false,
					error: true,
					message: `City cannot exceed ${MAX_FIELD_LENGTHS.city} characters`,
				});
			}
		}

		const stateValue = typeof state === 'string' ? state.trim() : state;
		if (typeof stateValue === 'string') {
			if (stateValue === '') {
				await session.abortTransaction();
				return response.status(400).json({
					success: false,
					error: true,
					message: 'state cannot be empty',
				});
			}
			if (stateValue.length > MAX_FIELD_LENGTHS.state) {
				await session.abortTransaction();
				return response.status(400).json({
					success: false,
					error: true,
					message: `State cannot exceed ${MAX_FIELD_LENGTHS.state} characters`,
				});
			}
		}

		const pincodeValue = typeof pincode === 'string' ? pincode.trim() : pincode;
		if (typeof pincodeValue === 'string' && pincodeValue === '') {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: 'pincode cannot be empty',
			});
		}

		const countryValue = typeof country === 'string' ? country.trim() : country;
		if (typeof countryValue === 'string') {
			if (countryValue === '') {
				await session.abortTransaction();
				return response.status(400).json({
					success: false,
					error: true,
					message: 'country cannot be empty',
				});
			}
			if (countryValue.length > MAX_FIELD_LENGTHS.country) {
				await session.abortTransaction();
				return response.status(400).json({
					success: false,
					error: true,
					message: `Country cannot exceed ${MAX_FIELD_LENGTHS.country} characters`,
				});
			}
		}

		const landmarkValue = typeof landmark === 'string' ? landmark.trim() : landmark;
		if (typeof landmarkValue === 'string' && landmarkValue === '') {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: 'landmark cannot be empty',
			});
		}
		if (typeof landmarkValue === 'string' && landmarkValue.length > MAX_FIELD_LENGTHS.landmark) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: `Landmark cannot exceed ${MAX_FIELD_LENGTHS.landmark} characters`,
			});
		}

		// Format validation (only for provided fields)
		if (typeof pincodeValue === 'string' && !isValidPincode(pincodeValue)) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: 'Pincode must be 5-6 digits',
			});
		}

		const normalizedMobile = mobile === undefined ? undefined : normalizeRussianMobile(mobile);
		if (mobile !== undefined && !normalizedMobile) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: 'Mobile must be a valid Russian phone number (7XXXXXXXXXX)',
			});
		}

		// Check if at least one field is provided
		const hasUpdates =
			address_line1 !== undefined ||
			city !== undefined ||
			state !== undefined ||
			pincode !== undefined ||
			country !== undefined ||
			mobile !== undefined ||
			landmark !== undefined ||
			addressType !== undefined ||
			selected !== undefined;

		if (!hasUpdates) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: 'No fields provided for update',
			});
		}

		// Validate addressType if provided
		if (addressType && !ADDRESS_TYPES.includes(addressType)) {
			await session.abortTransaction();
			return response.status(400).json({
				success: false,
				error: true,
				message: 'Invalid addressType. Must be "Home" or "Office"',
			});
		}

		// Build update object (only provided fields)
		const updateFields = {};
		if (address_line1 !== undefined) updateFields.address_line1 = addressLine1Value;
		if (city !== undefined) updateFields.city = cityValue;
		if (state !== undefined) updateFields.state = stateValue;
		if (pincode !== undefined) updateFields.pincode = pincodeValue;
		if (country !== undefined) updateFields.country = countryValue;
		if (mobile !== undefined) updateFields.mobile = normalizedMobile;
		if (landmark !== undefined) updateFields.landmark = landmarkValue;
		if (addressType !== undefined) updateFields.addressType = addressType;

		if (selected === true) {
			await AddressModel.updateMany({ userId, _id: { $ne: id } }, { selected: false }, { session });
			updateFields.selected = true;
		} else if (selected === false) {
			updateFields.selected = false;
		}

		// Update address (userId cannot be changed)
		const address = await AddressModel.findByIdAndUpdate(id, updateFields, {
			new: true,
			runValidators: true,
			session,
		});

		if (!address) {
			await session.abortTransaction();
			return response.status(404).json({
				success: false,
				error: true,
				message: 'Address not found',
			});
		}

		await session.commitTransaction();

		console.log(`[Address] Updated address ${id} for user ${userId}`);
		return successResponse(response, address, 'Address updated successfully');
	} catch (error) {
		await session.abortTransaction();
		return handleError(error, response);
	} finally {
		if (session.inTransaction()) {
			await session.abortTransaction();
		}
		session.endSession();
	}
}
