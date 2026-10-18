import type { Product } from '@/entities/product';

/**
 * Преобразует серверный продукт в формат Product для UI
 */
export function serverProductToProduct(serverProduct: Product): Product {
  return {
    _id: serverProduct._id,
    name: serverProduct.name || 'Без названия',
    description: serverProduct.description || '',
    images: serverProduct.images || [],
    videos: Array.isArray(serverProduct.videos)
      ? serverProduct.videos
          .map((v) => String(v ?? '').trim())
          .filter((u) => u.length > 0)
      : undefined,
    brand: serverProduct.brand,
    price: serverProduct.price || 0,
    oldPrice: serverProduct.oldPrice,
    catName: serverProduct.catName,
    catId: serverProduct.catId,
    subCatId: serverProduct.subCatId,
    subCat: serverProduct.subCat,
    thirdsubCat: serverProduct.thirdsubCat,
    thirdsubCatId: serverProduct.thirdsubCatId,
    category: serverProduct.category,
    countInStock: serverProduct.countInStock || 0,
    rating: serverProduct.rating || 0,
    isFeatured: serverProduct.isFeatured,
    discount: serverProduct.discount || 0,
    sale: serverProduct.sale,
    productRam: serverProduct.productRam,
    size: serverProduct.size,
    colors: serverProduct.colors,
    variantStock: serverProduct.variantStock,
    productWeight: serverProduct.productWeight,
    bannerimages: serverProduct.bannerimages,
    bannerTitleName: serverProduct.bannerTitleName,
    isDisplayOnHomeBanner: serverProduct.isDisplayOnHomeBanner,
    reviewCount: serverProduct.reviewCount,
    specifications: serverProduct.specifications,
    inStock:
      (serverProduct.countInStock ?? 0) > 0 ||
      (Array.isArray(serverProduct.variantStock) &&
        serverProduct.variantStock.some((r) => (r?.count ?? 0) > 0)),
    createdAt: serverProduct.createdAt,
    updatedAt: serverProduct.updatedAt,
  };
}
