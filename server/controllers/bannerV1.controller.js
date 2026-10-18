import BannerV1Model from '../models/bannerV1.model.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Cloudinary конфиг логично выносится наверх и не требует изменений
cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

/**
 * Загрузка изображений на Cloudinary
 * POST /api/banner/upload-images
 */
export async function uploadImages(req, res) {
  try {
    const files = req.files;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        message: 'Нет файлов для загрузки',
        error: true,
        success: false,
      });
    }

    const uploadOptions = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    // Массив ссылок на успешно загруженные изображения
    const uploadedImages = [];

    for (const file of files) {
      try {
        const uploadResult = await cloudinary.uploader.upload(file.path, uploadOptions);
        uploadedImages.push(uploadResult.secure_url);
      } finally {
        fs.unlink(file.path, () => {}); // Удаляем временный файл, не блокируем на ошибку
      }
    }

    return res.status(200).json({
      images: uploadedImages,
      success: true,
      error: false,
      message: 'Изображения успешно загружены',
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
 * Создание нового баннера
 * POST /api/banner
 */
export async function addBanner(req, res) {
  try {
    const { bannerTitle, images, catId, subCatId, thirdsubCatId, price, alignInfo } = req.body;

    if (!bannerTitle || !images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        message: 'Укажите все обязательные поля (bannerTitle, images)',
        error: true,
        success: false,
      });
    }

    const banner = new BannerV1Model({
      bannerTitle,
      images,
      catId,
      subCatId,
      thirdsubCatId,
      price,
      alignInfo,
    });

    const savedBanner = await banner.save();

    return res.status(201).json({
      message: 'Баннер успешно создан',
      error: false,
      success: true,
      banner: savedBanner,
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
 * Получить все баннеры
 * GET /api/banner
 */
export async function getBanners(req, res) {
  try {
    const banners = await BannerV1Model.find().lean();

    return res.status(200).json({
      error: false,
      success: true,
      data: banners,
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
 * Получить баннер по id
 * GET /api/banner/:id
 */
export async function getBanner(req, res) {
  try {
    const banner = await BannerV1Model.findById(req.params.id).lean();

    if (!banner) {
      return res.status(404).json({
        message: 'Баннер с таким ID не найден',
        error: true,
        success: false,
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      banner,
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
 * Удаление баннера с удалением изображений из Cloudinary
 * DELETE /api/banner/:id
 */
export async function deleteBanner(req, res) {
  try {
    const banner = await BannerV1Model.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        message: 'Баннер не найден!',
        success: false,
        error: true,
      });
    }

    // Асинхронно удаляем изображения из Cloudinary
    const destroyImagePromises = [];
    for (const imgUrl of banner.images) {
      // Извлекаем имя файла из URL
      const urlSegments = imgUrl.split('/');
      const imageName = urlSegments[urlSegments.length - 1].split('.')[0];
      if (imageName) {
        destroyImagePromises.push(cloudinary.uploader.destroy(imageName).catch(() => {}));
      }
    }
    await Promise.all(destroyImagePromises);

    await BannerV1Model.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Баннер удалён!',
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
 * Обновить баннер
 * PATCH /api/banner/:id
 */
export async function updatedBanner(req, res) {
  try {
    const { bannerTitle, images, catId, subCatId, thirdsubCatId, price, alignInfo } = req.body;

    const updatedFields = {};

    if (bannerTitle !== undefined) updatedFields.bannerTitle = bannerTitle;
    if (Array.isArray(images) && images.length > 0) updatedFields.images = images;
    if (catId !== undefined) updatedFields.catId = catId;
    if (subCatId !== undefined) updatedFields.subCatId = subCatId;
    if (thirdsubCatId !== undefined) updatedFields.thirdsubCatId = thirdsubCatId;
    if (price !== undefined) updatedFields.price = price;
    if (alignInfo !== undefined) updatedFields.alignInfo = alignInfo;

    const banner = await BannerV1Model.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true },
    ).lean();

    if (!banner) {
      return res.status(404).json({
        message: 'Баннер не найден для обновления!',
        success: false,
        error: true,
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      banner,
      message: 'Баннер успешно обновлён',
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}
