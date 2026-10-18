import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import HomeSliderModel from '../models/homeSlider.model.js';

// Инициализация Cloudinary
cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

// Глобальный массив для url загруженных изображений (используется для некоторых операций)
let imagesArr = [];

/**
 * Загрузка изображений на Cloudinary и удаление временного файла из uploads
 */
export async function uploadImages(req, res) {
  try {
    imagesArr = [];
    const files = req.files || [];
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        message: 'No images uploaded',
        error: true,
        success: false,
      });
    }

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    // Асинхронно загружаем все изображения последовательно
    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, options);
      imagesArr.push(result.secure_url);
      try {
        fs.unlinkSync(file.path);
      } catch (_) {
        /* file may not exist, ignore error */
      }
    }

    return res.status(200).json({ images: imagesArr });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

/**
 * Добавление нового слайда (home slide)
 */
export async function addHomeSlide(req, res) {
  try {
    if (!imagesArr.length) {
      return res.status(400).json({
        message: 'No images uploaded',
        error: true,
        success: false,
      });
    }

    const slide = new HomeSliderModel({ images: imagesArr });
    await slide.save();

    imagesArr = [];

    return res.status(200).json({
      message: 'Slide created',
      error: false,
      success: true,
      slide,
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
 * Получить все слайды
 */
export async function getHomeSlides(req, res) {
  try {
    const slides = await HomeSliderModel.find();
    if (!slides || slides.length === 0) {
      return res.status(404).json({
        message: 'Slides not found',
        error: true,
        success: false,
      });
    }
    return res.status(200).json({
      error: false,
      success: true,
      data: slides,
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
 * Получить слайд по id
 */
export async function getSlide(req, res) {
  try {
    const slide = await HomeSliderModel.findById(req.params.id);

    if (!slide) {
      return res.status(404).json({
        message: 'The slide with the given ID was not found.',
        error: true,
        success: false,
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      slide,
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
 * Удалить одно изображение из Cloudinary по URL
 */
export async function removeImageFromCloudinary(req, res) {
  const imgUrl = req.query.img;
  if (!imgUrl) {
    return res.status(400).json({
      message: 'Image url required',
      error: true,
      success: false,
    });
  }

  try {
    const urlArr = imgUrl.split('/');
    const image = urlArr[urlArr.length - 1];
    const imageName = image.split('.')[0];

    if (!imageName) {
      return res.status(400).json({
        message: 'Image name not found in url',
        error: true,
        success: false,
      });
    }

    const result = await cloudinary.uploader.destroy(imageName);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

/**
 * Удалить слайд и связанные с ним изображения
 */
export async function deleteSlide(req, res) {
  try {
    const slide = await HomeSliderModel.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({
        message: 'Slide not found!',
        success: false,
        error: true,
      });
    }

    // Удаляем каждое изображение, связанное с этим слайдом, из Cloudinary
    for (const imgUrl of slide.images || []) {
      try {
        const urlArr = imgUrl.split('/');
        const image = urlArr[urlArr.length - 1];
        const imageName = image.split('.')[0];
        if (imageName) {
          await cloudinary.uploader.destroy(imageName);
        }
      } catch (_) {}
    }

    await HomeSliderModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Slide deleted!',
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
}

/**
 * Обновить слайд (изображения)
 */
export async function updatedSlide(req, res) {
  try {
    // Обновление массива изображений: если загружены новые, они заменяют старые
    // (Здесь предполагается, что imagesArr содержит новые загруженные изображения)
    const images = imagesArr.length > 0 ? imagesArr : req.body.images;
    const slide = await HomeSliderModel.findByIdAndUpdate(req.params.id, { images }, { new: true });

    imagesArr = [];

    if (!slide) {
      return res.status(500).json({
        message: 'Slide cannot be updated!',
        success: false,
        error: true,
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      slide,
      message: 'Slide updated successfully',
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
 * Удалить несколько слайдов и связанные с ними изображения
 */
export async function deleteMultipleSlides(req, res) {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: true, success: false, message: 'Invalid input' });
  }

  try {
    // Удаляем изображения по всем переданным id слайдов
    for (const id of ids) {
      const slide = await HomeSliderModel.findById(id);
      if (slide && Array.isArray(slide.images)) {
        for (const imgUrl of slide.images) {
          try {
            const urlArr = imgUrl.split('/');
            const image = urlArr[urlArr.length - 1];
            const imageName = image.split('.')[0];
            if (imageName) {
              await cloudinary.uploader.destroy(imageName);
            }
          } catch (_) {}
        }
      }
    }

    // Удаляем сами слайды из базы
    await HomeSliderModel.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      message: 'Slides deleted successfully',
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
