import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import CategoryModel from '../models/category.model.js';
import { appendAdminAudit } from '../utils/adminAudit.js';

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

let imagesArr = [];

/**
 * Upload images to Cloudinary and remove them from server
 */
export async function uploadImages(req, res) {
  try {
    imagesArr = [];

    const images = req.files || [];
    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    for (const image of images) {
      const result = await cloudinary.uploader.upload(image.path, options);
      imagesArr.push(result.secure_url);
      fs.unlinkSync(image.path);
    }

    return res.status(200).json({ images: imagesArr });
  } catch (error) {
    console.error('Error uploading images:', error);
    return res.status(500).json({
      message: error.message || 'Ошибка загрузки изображений',
      error: true,
      success: false,
    });
  }
}

/**
 * Create a new category
 */
export async function createCategory(req, res) {
  try {
    const categoryData = {
      name: req.body.name,
      images: imagesArr.length > 0 ? imagesArr : req.body.images || [],
      parentId: req.body.parentId,
      parentCatName: req.body.parentCatName,
    };

    const category = new CategoryModel(categoryData);

    const savedCategory = await category.save();

    imagesArr = [];

    await appendAdminAudit(req.userId, 'category.create', {
      entityType: 'category',
      entityId: String(savedCategory._id),
      metadata: { name: savedCategory.name },
    });

    return res.status(201).json({
      message: 'Category created successfully',
      error: false,
      success: true,
      category: savedCategory,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({
      message: error.message || 'Не удалось создать категорию',
      error: true,
      success: false,
    });
  }
}

/**
 * Get all categories as a tree structure
 */
export async function getCategories(req, res) {
  try {
    const categories = await CategoryModel.find();
    const categoryMap = {};

    categories.forEach((cat) => {
      categoryMap[cat._id] = { ...cat._doc, children: [] };
    });

    const rootCategories = [];

    categories.forEach((cat) => {
      if (cat.parentId && categoryMap[cat.parentId]) {
        categoryMap[cat.parentId].children.push(categoryMap[cat._id]);
      } else {
        rootCategories.push(categoryMap[cat._id]);
      }
    });

    return res.status(200).json({
      error: false,
      success: true,
      data: rootCategories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      message: error.message || 'Не удалось получить категории',
      error: true,
      success: false,
    });
  }
}

/**
 * Get count of root categories (categories without parent)
 */
export async function getCategoriesCount(req, res) {
  try {
    const categoryCount = await CategoryModel.countDocuments({
      parentId: { $in: [null, undefined] },
    });
    res.status(200).json({
      success: true,
      error: false,
      categoryCount,
    });
  } catch (error) {
    console.error('Error fetching categories count:', error);
    return res.status(500).json({
      message: error.message || 'Ошибка при получении количества категорий',
      error: true,
      success: false,
    });
  }
}

/**
 * Get count of subcategories (categories that have a parentId)
 */
export async function getSubCategoriesCount(req, res) {
  try {
    const subCategoryCount = await CategoryModel.countDocuments({ parentId: { $ne: null } });
    res.status(200).json({
      success: true,
      error: false,
      subCategoryCount,
    });
  } catch (error) {
    console.error('Error fetching subcategories count:', error);
    return res.status(500).json({
      message: error.message || 'Ошибка при получении количества подкатегорий',
      error: true,
      success: false,
    });
  }
}

/**
 * Get a single category by ID
 */
export async function getCategory(req, res) {
  try {
    const category = await CategoryModel.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: 'The category with the given ID was not found.',
        error: true,
        success: false,
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({
      message: error.message || 'Не удалось получить категорию',
      error: true,
      success: false,
    });
  }
}

/**
 * Remove image from Cloudinary
 */
export async function removeImageFromCloudinary(req, res) {
  try {
    const imgUrl = req.query.img;
    if (!imgUrl) {
      return res.status(400).json({ success: false, error: true, message: 'Image URL required' });
    }
    const urlArr = imgUrl.split('/');
    const image = urlArr[urlArr.length - 1];
    const imageName = image.split('.')[0];

    if (imageName) {
      const result = await cloudinary.uploader.destroy(imageName);
      return res.status(200).json(result);
    } else {
      return res
        .status(400)
        .json({ success: false, error: true, message: 'Invalid image name extracted from URL' });
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return res.status(500).json({
      message: error.message || 'Ошибка удаления изображения',
      error: true,
      success: false,
    });
  }
}

/**
 * Delete category and its subcategories, and remove all images from Cloudinary
 */
export async function deleteCategory(req, res) {
  try {
    const category = await CategoryModel.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        message: 'Category not found!',
        success: false,
        error: true,
      });
    }

    // Remove category images from Cloudinary
    for (const imgUrl of category.images || []) {
      const image = imgUrl.split('/').pop();
      const imageName = image ? image.split('.')[0] : null;
      if (imageName) {
        await cloudinary.uploader.destroy(imageName);
      }
    }

    // Delete subcategories and their children recursively
    const deleteSubCategories = async (parentId) => {
      const subCategories = await CategoryModel.find({ parentId });
      for (const subCat of subCategories) {
        await deleteSubCategories(subCat._id);
        for (const imgUrl of subCat.images || []) {
          const image = imgUrl.split('/').pop();
          const imageName = image ? image.split('.')[0] : null;
          if (imageName) {
            await cloudinary.uploader.destroy(imageName);
          }
        }
        await CategoryModel.findByIdAndDelete(subCat._id);
      }
    };
    await deleteSubCategories(req.params.id);

    // Delete the main category
    await CategoryModel.findByIdAndDelete(req.params.id);

    await appendAdminAudit(req.userId, 'category.delete', {
      entityType: 'category',
      entityId: String(req.params.id),
    });

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Category and all its subcategories have been deleted!',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({
      message: error.message || 'Ошибка удаления категории',
      success: false,
      error: true,
    });
  }
}

/**
 * Update category by ID
 */
export async function updatedCategory(req, res) {
  try {
    const category = await CategoryModel.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        message: 'Category cannot be updated!',
        success: false,
        error: true,
      });
    }

    if (req.body.name !== undefined) category.name = req.body.name;
    if (req.body.parentId !== undefined) category.parentId = req.body.parentId || null;
    if (req.body.parentCatName !== undefined) category.parentCatName = req.body.parentCatName;
    if (imagesArr.length > 0) {
      category.images = imagesArr;
    } else if (Array.isArray(req.body.images)) {
      category.images = req.body.images;
    }

    await category.save();
    imagesArr = [];

    await appendAdminAudit(req.userId, 'category.update', {
      entityType: 'category',
      entityId: String(category._id),
    });

    return res.status(200).json({
      error: false,
      success: true,
      category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({
      message: error.message || 'Ошибка обновления категории',
      success: false,
      error: true,
    });
  }
}
