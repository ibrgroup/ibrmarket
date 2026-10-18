import mongoose from 'mongoose';
import WishlistModel from '../models/wishlist.model.js';

/**
 * Merge guest wishlist with authenticated user wishlist
 *
 * CRITICAL:
 * - Uses MongoDB transaction for atomic operation
 * - Union operation (no duplicates by productId)
 * - Server items take precedence for metadata
 * - Prevents multi-tab race conditions
 *
 * @route POST /api/wishlist/merge
 * @access Protected (requires auth)
 */
export const mergeWishlistController = async (request, response) => {
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
      `🔄 [Wishlist Merge] Starting merge for user ${userId} with ${guestItems.length} guest items`,
    );

    // Load existing server wishlist
    const serverWishlistItems = await WishlistModel.find({ userId }).session(session);
    const existingProductIds = new Set(serverWishlistItems.map((item) => item.productId));

    let addedCount = 0;

    // Merge logic: Union operation (no duplicates)
    for (const guestItem of guestItems) {
      const { productId } = guestItem;

      // Skip if already exists in server wishlist
      if (existingProductIds.has(productId)) {
        continue;
      }

      // Add new item to wishlist
      const newWishlistItem = new WishlistModel({
        productId,
        productTitle: guestItem.productTitle || guestItem.name,
        image: guestItem.image,
        rating: guestItem.rating || 0,
        price: guestItem.price,
        oldPrice: guestItem.oldPrice || guestItem.price,
        brand: guestItem.brand,
        discount: guestItem.discount || 0,
        userId,
      });

      await newWishlistItem.save({ session });
      addedCount++;
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Load merged wishlist
    const mergedWishlist = await WishlistModel.find({ userId });

    console.log(
      `✅ [Wishlist Merge] Merge completed: ${mergedWishlist.length} total items, ${addedCount} added from guest`,
    );

    return response.status(200).json({
      message: 'Wishlist merged successfully',
      error: false,
      success: true,
      data: mergedWishlist,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ [Wishlist Merge] Error:', error);
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const addToWishlistController = async (request, response) => {
  try {
    const userId = request.userId; //middleware
    const { productId, productTitle, image, rating, price, oldPrice, brand, discount } =
      request.body;

    const item = await WishlistModel.findOne({
      userId: userId,
      productId: productId,
    });

    if (item) {
      return response.status(400).json({
        message: 'Item already in wishlist',
      });
    }

    const wishlistItem = new WishlistModel({
      productId,
      productTitle,
      image,
      rating,
      price,
      oldPrice,
      brand,
      discount,
      userId,
    });

    const save = await wishlistItem.save();

    return response.status(200).json({
      error: false,
      success: true,
      message: 'The product saved in the wishlist',
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const deleteFromWishlistController = async (request, response) => {
  try {
    const wishlistItem = await WishlistModel.findById(request.params.id);

    if (!wishlistItem) {
      return response.status(404).json({
        error: true,
        success: false,
        message: 'The item with this given id was not found',
      });
    }

    const deletedItem = await WishlistModel.findByIdAndDelete(request.params.id);

    if (!deletedItem) {
      return response.status(404).json({
        error: true,
        success: false,
        message: 'The item is not deleted',
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      message: 'The item removed from wishlist',
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const getWishlistController = async (request, response) => {
  try {
    const userId = request.userId;

    const wishlistItems = await WishlistModel.find({
      userId: userId,
    });

    return response.status(200).json({
      error: false,
      success: true,
      data: wishlistItems,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};
