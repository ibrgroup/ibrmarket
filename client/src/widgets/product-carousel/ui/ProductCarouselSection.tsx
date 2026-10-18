'use client';

import { ProductCard } from '@/entities/product';
import type { Product } from '@/entities/product/model/types';
import { cn } from '@/shared/lib/utils';
import { Card } from '@/shared/ui/card';
import { useMemo } from 'react';
import { SwiperSlide } from 'swiper/react';

export interface ProductCarouselSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  className?: string;
  onAddToCart: (product: Product) => void | Promise<void>;
  onToggleWishlist: (product: Product) => void | Promise<void>;
  isInWishlist: (id: string) => boolean;
  isInCart?: (product: Product) => boolean;
}

export function ProductCarouselSection({
  title,
  subtitle,
  products,
  className,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
  isInCart,
}: ProductCarouselSectionProps) {
  const slides = useMemo(
    () =>
      products.map((p) => (
        <SwiperSlide key={p._id} className={cn('!h-auto !w-full')}>
          <div className="h-full w-full">
            <ProductCard
              product={p}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              isInWishlist={isInWishlist}
              isInCart={isInCart}
            />
          </div>
        </SwiperSlide>
      )),
    [products, onAddToCart, onToggleWishlist, isInWishlist, isInCart],
  );

  if (!products.length) return null;

  return (
    <Card className={cn('min-w-0 max-w-full mt-3 gap-0 overflow-hidden py-0', className)}>
      {/* Шапка: не даём flex-родителю раздуваться — min-w-0 */}
      <div className="flex min-w-0 flex-col gap-3 px-2 pb-4 pt-4 sm:flex-row sm:items-start sm:justify-between md:px-6 md:pt-6">
        <div className="min-w-0 flex-1 pr-2">
          <h2 className="text-xl font-roboto font-bold text-foreground md:text-xl">{title}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-0.5 md:gap-5 lg:grid-cols-6">{slides}</div>
    </Card>
  );
}
