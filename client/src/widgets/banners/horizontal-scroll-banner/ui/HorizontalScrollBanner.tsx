'use client';

import type { FC } from 'react';
import type { IProduct } from '../model/types';

interface HorizontalScrollBannerProps {
  title?: string;
  products?: IProduct[];
  onProductClick?: (product: IProduct) => void;
  onAddToCart?: (product: IProduct) => void;
}

/** Заглушка: разметка закомментирована; пропсы сохранены для совместимости. */
export const HorizontalScrollBanner: FC<HorizontalScrollBannerProps> = () => {
  return <section className="w-full py-5" />;
};

export default HorizontalScrollBanner;
