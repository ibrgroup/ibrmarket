import type { Product } from '../model/types';

export type ProductGallerySlide = { type: 'image'; url: string } | { type: 'video'; url: string };

function pushUrl(out: string[], item: unknown) {
  if (typeof item === 'string') {
    const t = item.trim();
    if (t) out.push(t);
    return;
  }
  if (item && typeof item === 'object' && 'url' in item) {
    const u = String((item as { url?: string }).url ?? '').trim();
    if (u) out.push(u);
  }
}

/** URL картинок: основная галерея + баннеры, без дубликатов */
export function collectProductImageUrls(product: Product | null): string[] {
  if (!product) return [];
  const out: string[] = [];
  if (Array.isArray(product.images)) product.images.forEach((i) => pushUrl(out, i));
  if (Array.isArray(product.bannerimages)) product.bannerimages.forEach((i) => pushUrl(out, i));
  return [...new Set(out)];
}

function collectVideoUrls(product: Product | null): string[] {
  if (!product || !Array.isArray(product.videos)) return [];
  const out: string[] = [];
  for (const v of product.videos) {
    if (typeof v === 'string') {
      const t = v.trim();
      if (t) out.push(t);
    }
  }
  return [...new Set(out)];
}

/**
 * Слайды галереи: сначала ролики (как на маркетплейсах), затем фото.
 * URL, попавшие и в видео, и в фото, остаются одним слайдом (видео).
 */
export function collectProductGallerySlides(product: Product | null): ProductGallerySlide[] {
  if (!product) return [];
  const videos = collectVideoUrls(product);
  const imageUrls = collectProductImageUrls(product);
  const videoSet = new Set(videos);
  const imagesOnly = imageUrls.filter((u) => !videoSet.has(u));
  return [
    ...videos.map((url) => ({ type: 'video' as const, url })),
    ...imagesOnly.map((url) => ({ type: 'image' as const, url })),
  ];
}

/** Картинка для корзины / избранного по текущему слайду */
/** Первое видео для превью в каталоге (hover), без загрузки до наведения */
export function getProductCatalogHoverVideo(product: Product | null): string | null {
  if (!product?.videos?.length) return null;
  for (const v of product.videos) {
    if (typeof v === 'string') {
      const t = v.trim();
      if (t) return t;
    }
  }
  return null;
}

export function pickCartImageFromGallery(
  slides: ProductGallerySlide[],
  slideIndex: number,
  fallback: string,
): string {
  if (slides.length === 0) return fallback;
  const i = Math.min(Math.max(0, slideIndex), slides.length - 1);
  const cur = slides[i];
  if (cur.type === 'image') return cur.url;
  const firstImg = slides.find((s) => s.type === 'image');
  return firstImg?.url ?? fallback;
}
