'use client';

import type { Product } from '@/entities/product';
import { useMemo } from 'react';

interface ProductPriceProps {
  product: Product;
}

export function ProductPrice({ product }: ProductPriceProps) {
  const discountPercent = useMemo(() => {
    if (!product.oldPrice || !product.price) return 0;
    return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  }, [product.oldPrice, product.price]);

  return (
    <div className="flex py-3 flex-wrap items-center font-roboto gap-3">
      <span className="text-pink-500 text-3xl font-bold lg:text-4xl">
        {product.price.toLocaleString()}
        <span className="ml-1 text-2xl font-medium">₽</span>
      </span>
      {product.oldPrice && (
        <>
          <span className="text-muted-foreground text-md line-through">
            {product.oldPrice.toLocaleString()} ₽
          </span>
 
        </>
      )}
    </div>
  );
}
