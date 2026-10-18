import LogoModel from '../models/logo.model.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

/**
 * Загрузка изображений логотипа (может быть несколько)
 * POST /api/logo/upload
 */
export async function uploadImages(req, res) {
  try {
    const files = req.files;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        message: 'Файлы для загрузки не найдены',
        error: true,
        success: false,
      });
    }

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    const uploadPromises = files.map(async file => {
      try {
        const result = await cloudinary.uploader.upload(file.path, options);
        // удаляем файл после загрузки на cloudinary
        fs.unlinkSync(file.path);
        return result.secure_url;
      } catch (err) {
        // удаляем временный файл даже при ошибке
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw err;
      }
    });

    const images = await Promise.all(uploadPromises);

    return res.status(200).json({
      images,
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
 * Добавление нового логотипа
 * POST /api/logo
 */
export async function addLogo(req, res) {
  try {
    const { logo } = req.body;
    if (!logo) {
      return res.status(400).json({
        message: 'Ссылка на логотип обязательна',
        error: true,
        success: false,
      });
    }
    const logoItem = new LogoModel({ logo });

    await logoItem.save();

    return res.status(201).json({
      message: 'Логотип успешно добавлен',
      error: false,
      success: true,
      logo: logoItem,
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
 * Получение всех логотипов
 * GET /api/logo
 */
export async function getLogo(req, res) {
  try {
    const logos = await LogoModel.find();
    return res.status(200).json({
      error: false,
      success: true,
      logo: logos,
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
 * Получение логотипа по id
 * GET /api/logo/:id
 */
export async function getLogoById(req, res) {
  try {
    const logo = await LogoModel.findById(req.params.id);

    if (!logo) {
      return res.status(404).json({
        message: 'Логотип с указанным ID не найден',
        error: true,
        success: false,
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      logo,
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
 * Обновление логотипа по id
 * PUT /api/logo/:id
 */
export async function updatedLogo(req, res) {
  try {
    const { logo } = req.body;
    if (!logo) {
      return res.status(400).json({
        message: 'Ссылка на логотип обязательна',
        error: true,
        success: false,
      });
    }
    const updated = await LogoModel.findByIdAndUpdate(req.params.id, { logo }, { new: true });

    if (!updated) {
      return res.status(404).json({
        message: 'Логотип для обновления не найден',
        success: false,
        error: true,
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      logo: updated,
      message: 'Логотип успешно обновлен',
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
 * Удаление изображения из Cloudinary
 * DELETE /api/logo/remove-image?img=<imgUrl>
 */
export async function removeImageFromCloudinary(req, res) {
  try {
    const imgUrl = req.query.img;
    if (!imgUrl) {
      return res.status(400).json({
        message: 'Не указан URL изображения',
        error: true,
        success: false,
      });
    }

    // получаем public_id картинки без расширения
    const urlParts = imgUrl.split('/');
    const fileNameWithExt = urlParts[urlParts.length - 1];
    const publicId = fileNameWithExt.split('.')[0];

    if (!publicId) {
      return res.status(400).json({
        message: 'Некорректный URL изображения',
        error: true,
        success: false,
      });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok' || result.result === 'not found') {
      return res.status(200).json({
        message: `Изображение удалено: ${publicId}`,
        error: false,
        success: true,
        cloudinaryResult: result,
      });
    } else {
      return res.status(500).json({
        message: 'Ошибка удаления изображения на стороне cloudinary',
        error: true,
        success: false,
        cloudinaryResult: result,
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
