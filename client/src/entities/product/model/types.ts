// Типы для сущности Product
export interface Product {
  _id: string;
  name: string;
  description: string;
  images: string[];
  /** Прямые URL видео (mp4, webm и т.д.) — показываются в галерее первыми */
  videos?: string[];
  brand?: string;
  price: number;
  oldPrice?: number;
  catName?: string;
  catId?: string;
  subCatId?: string;
  subCat?: string;
  thirdsubCat?: string;
  thirdsubCatId?: string;
  category?: {
    _id: string;
    name: string;
    slug?: string;
  };
  countInStock: number;
  rating?: number;
  isFeatured?: boolean;
  discount: number;
  sale?: number;
  productRam?: string[];
  size?: string[];
  /** Доступные цвета (одежда и др.) */
  colors?: string[];
  /** Опционально: остатки по вариантам (сервер). Пусто — только countInStock. */
  variantStock?: Array<{
    size?: string;
    color?: string;
    weight?: string;
    ram?: string;
    count: number;
  }>;
  productWeight?: string[];
  bannerimages?: string[];
  bannerTitleName?: string;
  isDisplayOnHomeBanner?: boolean;
  createdAt?: string;
  updatedAt?: string;
  reviewCount?: number;
  specifications?: Record<string, any>;
  inStock?: boolean | number;
}

export interface ProductListProps {
  products: Product[];
  className?: string;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isInWishlist?: (id: string) => boolean;
}

// Типы для бесконечной прокрутки (infinity scroll)
export interface InfiniteProductParams {
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'name' | 'rating' | 'createdAt';
  order?: 'asc' | 'desc';
  sortOrder?: 'asc' | 'desc';
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean | null;
  categories?: string[];
  brands?: string[];
  priceRange?: [number, number];
}

export interface InfiniteProductResponse {
  products: Product[];
  hasMore: boolean;
  nextPage?: number;
  total: number;
  page: number;
  totalPages: number;
}

export interface InfiniteProductItem {
  _id: string;
  product: Product;
}
