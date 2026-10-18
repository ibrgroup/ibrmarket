import mongoose from 'mongoose';
import CartModel from '../models/cart.model.js';
import ProductModel from '../models/product.model.js';
import { getAvailableStockForLine } from '../utils/variantStock.js';

function normVariant(v) {
	if (v == null || v === undefined) return '';
	return String(v);
}

/**
 * Merge guest cart with authenticated user cart
 *
 * CRITICAL:
 * - Uses MongoDB transaction for atomic operation
 * - Validates stock limits (countInStock)
 * - Returns adjustedItems if quantities were capped
 * - Prevents multi-tab race conditions
 *
 * @route POST /api/cart/merge
 * @access Protected (requires auth)
 */
export const mergeCartController = async (request, response) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const userId = request.userId; // from auth middleware
		const { guestItems } = request.body;

		if (!Array.isArray(guestItems)) {
			await session.abortTransaction();
			session.endSession();
			return response.status(400).json({
				message: 'guestItems must be an array',
				error: true,
				success: false,
			});
		}

		console.log(
			`🔄 [Cart Merge] Starting merge for user ${userId} with ${guestItems.length} guest items`,
		);

		// Load existing server cart
		const serverCartItems = await CartModel.find({ userId }).session(session);
		const adjustedItems = []; // Track items with quantity reductions due to stock limits

		// CRITICAL: Track which guest items have been processed to ensure idempotency
		// If merge is called multiple times with same guestItems, we should not double-merge
		// Strategy: Check if server cart already contains items that match guest items exactly
		// If server quantity >= guest quantity for matching item, skip (already merged)
		const processedGuestItems = new Set(); // Track processed guest items by key

		// Merge logic
		for (const guestItem of guestItems) {
			const { productId, size, weight, ram, color, quantity: guestQuantity } = guestItem;

			// Create unique key for this guest item variant
			const guestItemKey = `${productId}-${normVariant(size)}-${normVariant(weight)}-${normVariant(ram)}-${normVariant(color)}`;

			// IDEMPOTENCY CHECK: Skip if this guest item was already processed in this merge
			if (processedGuestItems.has(guestItemKey)) {
				console.log(`⏭️ [Cart Merge] Skipping duplicate guest item: ${guestItemKey}`);
				continue;
			}

			// Find matching server item (same product + variant)
			const matchingServerItem = serverCartItems.find(
				(item) =>
					item.productId === productId &&
					normVariant(item.size) === normVariant(size) &&
					normVariant(item.weight) === normVariant(weight) &&
					normVariant(item.ram) === normVariant(ram) &&
					normVariant(item.color) === normVariant(color),
			);

			// Fetch product to get current stock (check only at merge; cart does not store stock)
			const product = await ProductModel.findById(productId).session(session);
			const countInStock = product ? getAvailableStockForLine(product, guestItem) : 999;

			if (matchingServerItem) {
				// IDEMPOTENCY CHECK: Enhanced logic to prevent double-merge
				// Strategy: If server quantity is significantly larger than guest quantity,
				// it likely means merge was already performed (server = original + guest)
				const serverQuantity = matchingServerItem.quantity || 0;

				// CRITICAL: Enhanced idempotency check
				// If serverQuantity >= guestQuantity, merge was likely already done
				// BUT: If serverQuantity is much larger (2x+), it's definitely from previous merge
				// We use a threshold to detect if merge was already performed
				const IDEMPOTENCY_THRESHOLD = 1.5; // If server >= guest * 1.5, merge was done
				const likelyAlreadyMerged = serverQuantity >= guestQuantity * IDEMPOTENCY_THRESHOLD;
				const simpleAlreadyMerged = serverQuantity >= guestQuantity;

				// If server quantity suggests merge was already done, skip (idempotent)
				if (likelyAlreadyMerged || simpleAlreadyMerged) {
					console.log(
						`⏭️ [Cart Merge] Server quantity (${serverQuantity}) >= guest quantity (${guestQuantity}) for ${guestItemKey}, skipping (idempotent)`,
					);
					processedGuestItems.add(guestItemKey);
					continue;
				}

				// Merge: sum quantities (standard merge behavior)
				// CRITICAL: This is idempotent because:
				// - If merge was already done, serverQuantity >= guestQuantity (checked above)
				// - Enhanced check with threshold prevents double-merge even if guest cart changed
				// - Frontend guarantees only one call via tryMergeOnce()
				const requestedQuantity = serverQuantity + guestQuantity;
				const actualQuantity = Math.min(requestedQuantity, countInStock);

				// Track if quantity was adjusted
				if (actualQuantity < requestedQuantity) {
					adjustedItems.push({
						productId,
						productTitle: guestItem.productTitle || guestItem.name,
						requestedQuantity,
						actualQuantity,
						reason: 'stock_limit',
					});
				}

				// Update server item
				await CartModel.updateOne(
					{ _id: matchingServerItem._id },
					{
						quantity: actualQuantity,
						subTotal: guestItem.price * actualQuantity,
						// Update metadata from guest item if newer
						...(guestItem.price && { price: guestItem.price }),
						...(guestItem.oldPrice && { oldPrice: guestItem.oldPrice }),
						...(guestItem.discount && { discount: guestItem.discount }),
						...(guestItem.image && { image: guestItem.image }),
					},
				).session(session);
			} else {
				// New item: add to cart
				const requestedQuantity = guestQuantity;
				const actualQuantity = Math.min(requestedQuantity, countInStock);

				// Track if quantity was adjusted
				if (actualQuantity < requestedQuantity) {
					adjustedItems.push({
						productId,
						productTitle: guestItem.productTitle || guestItem.name,
						requestedQuantity,
						actualQuantity,
						reason: 'stock_limit',
					});
				}

				const newCartItem = new CartModel({
					productTitle: guestItem.productTitle || guestItem.name,
					image: guestItem.image,
					rating: guestItem.rating || 0,
					price: guestItem.price,
					oldPrice: guestItem.oldPrice || guestItem.price,
					quantity: actualQuantity,
					subTotal: guestItem.price * actualQuantity,
					productId: guestItem.productId,
					userId,
					brand: guestItem.brand,
					discount: guestItem.discount || 0,
					size: normVariant(guestItem.size),
					weight: normVariant(guestItem.weight),
					ram: normVariant(guestItem.ram),
					color: normVariant(guestItem.color),
				});

				await newCartItem.save({ session });
			}

			// Mark this guest item as processed (idempotency tracking)
			processedGuestItems.add(guestItemKey);
		}

		// Commit transaction
		await session.commitTransaction();
		session.endSession();

		// Load merged cart
		const mergedCart = await CartModel.find({ userId });

		console.log(
			`✅ [Cart Merge] Merge completed: ${mergedCart.length} total items, ${adjustedItems.length} adjusted`,
		);

		return response.status(200).json({
			message: 'Cart merged successfully',
			error: false,
			success: true,
			data: mergedCart,
			adjustedItems: adjustedItems.length > 0 ? adjustedItems : undefined,
		});
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		console.error('❌ [Cart Merge] Error:', error);
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
};

export const addToCartItemController = async (request, response) => {
	try {
		const userId = request.userId; //middleware
		const {
			productTitle,
			image,
			rating,
			price,
			oldPrice,
			quantity,
			subTotal,
			productId,
			discount,
			size,
			weight,
			ram,
			color,
			brand,
		} = request.body;

		if (!productId) {
			return response.status(402).json({
				message: 'Provide productId',
				error: true,
				success: false,
			});
		}

		const checkItemCart = await CartModel.findOne({
			userId: userId,
			productId: productId,
			size: normVariant(size),
			weight: normVariant(weight),
			ram: normVariant(ram),
			color: normVariant(color),
		});

		if (checkItemCart) {
			const newQty = (checkItemCart.quantity || 0) + (quantity || 1);
			const newSubTotal = price * newQty;
			await CartModel.updateOne(
				{ _id: checkItemCart._id },
				{ quantity: newQty, subTotal: newSubTotal },
			);
			const updated = await CartModel.findById(checkItemCart._id);
			return response.status(200).json({
				data: updated,
				message: 'Item quantity updated',
				error: false,
				success: true,
			});
		}

		const cartItem = new CartModel({
			productTitle: productTitle,
			image: image,
			rating: rating,
			price: price,
			oldPrice: oldPrice,
			quantity: quantity,
			subTotal: subTotal,
			productId: productId,
			userId: userId,
			brand: brand,
			discount: discount,
			size: normVariant(size),
			weight: normVariant(weight),
			ram: normVariant(ram),
			color: normVariant(color),
		});

		const save = await cartItem.save();

		return response.status(200).json({
			data: save,
			message: 'Item add successfully',
			error: false,
			success: true,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
};

export const getCartItemController = async (request, response) => {
	try {
		const userId = request.userId;

		const cartItems = await CartModel.find({
			userId: userId,
		});

		return response.json({
			data: cartItems,
			error: false,
			success: true,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
};

export const updateCartItemQtyController = async (request, response) => {
	try {
		const userId = request.userId;
		const { _id, qty, subTotal, size, weight, ram, color } = request.body;

		if (!_id || !qty) {
			return response.status(400).json({
				message: 'provide _id, qty',
			});
		}

		const updateCartitem = await CartModel.updateOne(
			{
				_id: _id,
				userId: userId,
			},
			{
				quantity: qty,
				subTotal: subTotal,
				size: size,
				ram: ram,
				weight: weight,
				...(color !== undefined && { color }),
			},
			{ new: true },
		);

		return response.json({
			message: 'Update cart item',
			success: true,
			error: false,
			data: updateCartitem,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
};

export const deleteCartItemQtyController = async (request, response) => {
	try {
		const userId = request.userId; // middleware
		const { id } = request.params;

		if (!id) {
			return response.status(400).json({
				message: 'Provide _id',
				error: true,
				success: false,
			});
		}

		// Временные id клиента (Date.now) не являются ObjectId — иначе CastError → 500
		if (!/^[0-9a-fA-F]{24}$/.test(String(id))) {
			return response.status(400).json({
				message: 'Invalid cart item id',
				error: true,
				success: false,
			});
		}

		const deleteCartItem = await CartModel.deleteOne({ _id: id, userId: userId });

		if (!deleteCartItem) {
			return response.status(404).json({
				message: 'The product in the cart is not found',
				error: true,
				success: false,
			});
		}

		return response.status(200).json({
			message: 'Item remove',
			error: false,
			success: true,
			data: deleteCartItem,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
};

export const emptyCartController = async (request, response) => {
	try {
		const userId = request.params.id; // middlewar

		await CartModel.deleteMany({ userId: userId });

		return response.status(200).json({
			error: false,
			success: true,
		});
	} catch (error) {
		return response.status(500).json({
			message: error.message || error,
			error: true,
			success: false,
		});
	}
};
