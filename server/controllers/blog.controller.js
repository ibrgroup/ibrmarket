/**
 * Контроллеры для блога
 * - Поддержка загрузки изображений через Cloudinary
 * - CRUD для BlogModel
 */

import BlogModel from '../models/blog.model.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

/**
 * Загрузка изображений на Cloudinary
 * Ожидает массив файлов в request.files (Multer).
 * Возвращает массив secure_url для каждой картинки.
 */
export async function uploadImages(request, response) {
  try {
    if (!request.files || !Array.isArray(request.files) || request.files.length === 0) {
      return response.status(400).json({
        message: 'Выберите хотя бы одно изображение для загрузки',
        error: true,
        success: false,
      });
    }

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    // Все загрузки в параллель
    const uploadResults = await Promise.all(
      request.files.map(async file => {
        try {
          const result = await cloudinary.uploader.upload(file.path, options);
          // После загрузки - удалить файл с дискa
          fs.unlinkSync(file.path);
          return result.secure_url;
        } catch (err) {
          fs.unlinkSync(file.path);
          throw err;
        }
      }),
    );

    return response.status(200).json({
      images: uploadResults,
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
}

/**
 * Добавление нового блога
 * - title, description обязательны
 * - images (массив url) из body
 */
export async function addBlog(request, response) {
  try {
    const { title, images = [], description } = request.body;

    if (!title || !description) {
      return response.status(400).json({
        message: 'Заголовок и описание обязательны',
        error: true,
        success: false,
      });
    }

    const blog = new BlogModel({
      title,
      images,
      description,
    });

    await blog.save();

    return response.status(201).json({
      message: 'Блог успешно создан',
      error: false,
      success: true,
      blog,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

/**
 * Получение списка блогов с пагинацией
 * - page и perPage из query string
 */
export async function getBlogs(request, response) {
  try {
    const page = Math.max(1, parseInt(request.query.page) || 1);
    const perPage = Math.max(1, parseInt(request.query.perPage) || 10);

    const totalPosts = await BlogModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages && totalPages > 0) {
      return response.status(404).json({
        message: 'Страница не найдена',
        success: false,
        error: true,
      });
    }

    const blogs = await BlogModel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

    return response.status(200).json({
      error: false,
      success: true,
      blogs,
      totalPages,
      page,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

/**
 * Получение одного блога по ID
 */
export async function getBlog(request, response) {
  try {
    const blog = await BlogModel.findById(request.params.id);

    if (!blog) {
      return response.status(404).json({
        message: 'Блог с указанным ID не найден',
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      blog,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

/**
 * Удаление блога и связанных изображений
 */
export async function deleteBlog(request, response) {
  try {
    const blog = await BlogModel.findById(request.params.id);

    if (!blog) {
      return response.status(404).json({
        message: 'Блог не найден!',
        success: false,
        error: true,
      });
    }

    // Удалить изображения из Cloudinary
    const destroyPromises = blog.images.map(imgUrl => {
      const urlArr = imgUrl.split('/');
      const image = urlArr[urlArr.length - 1];
      const imageName = image.split('.')[0];

      if (imageName) {
        return cloudinary.uploader.destroy(imageName);
      }
      return Promise.resolve();
    });

    await Promise.all(destroyPromises);

    await BlogModel.findByIdAndDelete(request.params.id);

    return response.status(200).json({
      success: true,
      error: false,
      message: 'Блог успешно удален',
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}

/**
 * Обновление блога
 * Если новые images переданы, обновляет их.
 */
export async function updateBlog(request, response) {
  try {
    const { title, description, images } = request.body;

    // Можно обновлять частично
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (Array.isArray(images) && images.length > 0) updateFields.images = images;

    const blog = await BlogModel.findByIdAndUpdate(request.params.id, updateFields, { new: true });

    if (!blog) {
      return response.status(404).json({
        message: 'Блог не найден для обновления',
        success: false,
        error: true,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      blog,
      message: 'Блог успешно обновлен',
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}
