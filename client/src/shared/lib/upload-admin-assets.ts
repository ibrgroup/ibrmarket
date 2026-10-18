import { apiClient } from '@/shared/api/client';

/** Рекомендуемое соотношение сторон баннера (ТЗ: 375×200). */
export const BANNER_ASPECT_RATIO = 375 / 200;
const BANNER_ASPECT_TOLERANCE = 0.06;

function loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Не удалось прочитать изображение «${file.name}»`));
    };
    img.src = url;
  });
}

/** Проверка пропорций баннера перед загрузкой.
 *  options.allowAnySize: если true, пропускаем проверку пропорций
 *  options.tolerance: дополнительный допуск для пропорций (переопределение константы)
 */
export async function validateBannerImageAspectRatio(
  file: File,
  options?: { allowAnySize?: boolean; tolerance?: number }
): Promise<void> {
  if (options?.allowAnySize) {
    // Разрешаем любые размеры баннера
    return;
  }

  const { width, height } = await loadImageDimensions(file);
  if (!width || !height) {
    throw new Error(`Не удалось определить размер «${file.name}»`);
  }
  const ratio = width / height;
  const tol = options?.tolerance ?? BANNER_ASPECT_TOLERANCE;
  if (Math.abs(ratio - BANNER_ASPECT_RATIO) > tol) {
    throw new Error(
      `«${file.name}»: нужна пропорция 375:200 (сейчас ${width}×${height}). Обрежьте или выберите другое фото.`
    );
  }
}

/** Лимит размера одного видео (байт). Сервер режет на ~52 МБ — клиент чуть строже. */
export const PRODUCT_VIDEO_MAX_BYTES = 48 * 1024 * 1024;

/**
 * Загрузка изображений товара (multipart → Cloudinary). Только ADMIN на API.
 */
export async function uploadProductImageFiles(files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const fd = new FormData();
  for (const f of files) {
    fd.append('images', f);
  }
  const res = await apiClient.post<{ images?: string[] }>('/api/product/uploadImages', fd);
  const raw = res as unknown as { images?: string[] };
  const images = raw.images;
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('Сервер не вернул URL изображений');
  }
  return images;
}

/**
 * Загрузка видео товара (multipart → Cloudinary, resource_type: video). Только ADMIN.
 * До 3 файлов за запрос, каждый не больше PRODUCT_VIDEO_MAX_BYTES.
 */
export async function uploadProductVideoFiles(files: File[]): Promise<string[]> {
  if (!files.length) return [];
  for (const f of files) {
    if (f.size > PRODUCT_VIDEO_MAX_BYTES) {
      throw new Error(
        `Файл «${f.name}» слишком большой (макс. ${Math.round(PRODUCT_VIDEO_MAX_BYTES / (1024 * 1024))} МБ). Сожмите ролик или укоротите.`,
      );
    }
    if (!f.type.startsWith('video/') && !/\.(mp4|webm|mov|m4v)$/i.test(f.name)) {
      throw new Error(`«${f.name}» не похож на видео (нужен mp4, webm, mov…).`);
    }
  }
  const fd = new FormData();
  for (const f of files) {
    fd.append('videos', f);
  }
  const res = await apiClient.post<{ videos?: string[] }>('/api/product/uploadVideos', fd);
  const raw = res as unknown as { videos?: string[] };
  const videos = raw.videos;
  if (!Array.isArray(videos) || videos.length === 0) {
    throw new Error('Сервер не вернул URL видео');
  }
  return videos;
}

/**
 * Загрузка изображений категории (multipart → Cloudinary). Только ADMIN на API.
 */
export async function uploadCategoryImageFiles(files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const fd = new FormData();
  for (const f of files) {
    fd.append('images', f);
  }
  const res = await apiClient.post<{ images?: string[] }>('/api/category/uploadImages', fd);
  const raw = res as unknown as { images?: string[] };
  const images = raw.images;
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('Сервер не вернул URL изображений');
  }
  return images;
}

/**
 * Загрузка изображений баннера (multipart → Cloudinary). PERM.CONTENT на API.
 */
export async function uploadBannerImageFiles(files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const fd = new FormData();
  for (const f of files) {
    fd.append('images', f);
  }
  const res = await apiClient.post<
    { images?: string[]; data?: { images?: string[] } }
  >('/api/bannerV1/uploadImages', fd);
  const raw = res as unknown as { images?: string[]; data?: { images?: string[] } };
  const images = Array.isArray(raw.images)
    ? raw.images
    : Array.isArray(raw.data?.images)
      ? raw.data.images
      : undefined;
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('Сервер не вернул URL изображений');
  }
  return images;
}