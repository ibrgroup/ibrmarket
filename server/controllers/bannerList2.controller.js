import BannerList2Model from '../models/bannerList2.model.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Конфигурируем Cloudinary один раз при старте процесса
cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

/**
 * Загрузка изображений на Cloudinary
 * @route POST /api/banners/upload-images
 */
export async function uploadImages(req, res) {
  /**
   * Принимает массив файлов (req.files).
   * Для каждого файла происходит загрузка в Cloudinary.
   * Файлы локально удаляются после загрузки.
   * Ответ – массив URL'ов загруженных картинок.
   */
  try {
    const { files } = req;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        message: 'Нет файлов для загрузки.',
        error: true,
        success: false,
      });
    }

    const uploadOptions = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    const uploadResults = [];
    for (const file of files) {
      // Оборачиваем cloudinary.uploader.upload в промис
      try {
        const uploadRes = await cloudinary.uploader.upload(file.path, uploadOptions);
        uploadResults.push(uploadRes.secure_url);
        fs.unlinkSync(file.path); // Безопасный путь к файлу
      } catch (error) {
        fs.existsSync(file.path) && fs.unlinkSync(file.path);
        return res.status(500).json({
          message: `Ошибка загрузки файла: ${file.originalname || file.filename}`,
          error: true,
          success: false,
        });
      }
    }

    return res.status(200).json({
      success: true,
      error: false,
      images: uploadResults,
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
 * Создать новый баннер
 * @route POST /api/banners
 */
export async function addBanner(req, res) {
  /**
   * Ожидает: images (array of strings), catId, subCatId, thirdsubCatId в req.body
   */
  try {
    const { images, catId, subCatId, thirdsubCatId } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({
        message: 'Необходимо добавить хотя бы одно изображение.',
        error: true,
        success: false,
      });
    }

    const banner = new BannerList2Model({
      images,
      catId,
      subCatId,
      thirdsubCatId,
    });

    await banner.save();

    return res.status(201).json({
      message: 'Баннер успешно создан.',
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
 * Получить список всех баннеров
 * @route GET /api/banners
 */
export async function getBanners(req, res) {
  try {
    const banners = await BannerList2Model.find().lean();

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
 * Получить баннер по ID
 * @route GET /api/banners/:id
 */
export async function getBanner(req, res) {
  try {
    const banner = await BannerList2Model.findById(req.params.id).lean();

    if (!banner) {
      return res.status(404).json({
        message: 'Баннер с указанным ID не найден.',
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
 * Удалить баннер и все связанные изображения из Cloudinary
 * @route DELETE /api/banners/:id
 */
export async function deleteBanner(req, res) {
  try {
    const banner = await BannerList2Model.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        message: 'Баннер не найден!',
        error: true,
        success: false,
      });
    }

    // Удаляем каждое изображение из Cloudinary
    for (const imgUrl of banner.images || []) {
      try {
        // Извлекаем public_id изображения
        const urlSegments = imgUrl.split('/');
        const filenameWithExt = urlSegments[urlSegments.length - 1];
        const publicId = filenameWithExt.split('.')[0];

        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (imgError) {
        // Логируем, но не прерываем выполнение
        if (process.env.NODE_ENV === 'development') {
          console.error('Ошибка удаления изображения из Cloudinary:', imgError);
        }
      }
    }

    await banner.deleteOne();

    return res.status(200).json({
      message: 'Баннер успешно удален.',
      success: true,
      error: false,
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
 * Обновить существующий баннер
 * @route PUT /api/banners/:id
 */
export async function updatedBanner(req, res) {
  /**
   * Может принимать новые images (array of url), catId, subCatId, thirdsubCatId
   * Если указаны новые images - опционально удалить старые из cloudinary (TODO)
   */
  try {
    const { images, catId, subCatId, thirdsubCatId } = req.body;

    // Опционально: если новые images, удалить старые
    const oldBanner = await BannerList2Model.findById(req.params.id);

    if (!oldBanner) {
      return res.status(404).json({
        message: 'Баннер не найден!',
        error: true,
        success: false,
      });
    }

    // Если указаны новые изображения, удаляем старые из Cloudinary
    if (images && Array.isArray(images) && images.length > 0) {
      for (const imgUrl of oldBanner.images || []) {
        try {
          const urlSegments = imgUrl.split('/');
          const filenameWithExt = urlSegments[urlSegments.length - 1];
          const publicId = filenameWithExt.split('.')[0];

          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (imgError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Ошибка удаления старого изображения из Cloudinary:', imgError);
          }
        }
      }
    }

    const nextBanner = await BannerList2Model.findByIdAndUpdate(
      req.params.id,
      {
        ...(images && { images }), // если есть новые имиджи - перезаписываем, иначе оставляем старые
        ...(catId !== undefined && { catId }),
        ...(subCatId !== undefined && { subCatId }),
        ...(thirdsubCatId !== undefined && { thirdsubCatId }),
      },
      { new: true },
    );

    if (!nextBanner) {
      return res.status(500).json({
        message: 'Не удалось обновить баннер!',
        success: false,
        error: true,
      });
    }

    return res.status(200).json({
      message: 'Баннер успешно обновлен.',
      success: true,
      error: false,
      banner: nextBanner,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}
