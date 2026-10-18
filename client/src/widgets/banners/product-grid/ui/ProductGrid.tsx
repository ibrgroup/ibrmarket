'use client';

import type { FC } from 'react';
import type { IProduct } from '../model/types';

interface ProductGridProps {
  products?: IProduct[];
  onProductClick?: (product: IProduct) => void;
  onAddToCart?: (product: IProduct) => void;
}

/** Заглушка: сетка закомментирована; пропсы сохранены для совместимости. */
export const ProductGrid: FC<ProductGridProps> = () => {
  return <section className="w-full py-8" />;
};

export default ProductGrid;
