'use client';

import type { Product } from '@/entities/product';
import { ROUTES } from '@/features/product-quick-view/model/constants';
import { Copy } from 'lucide-react';
import Link from 'next/link';

interface ProductHeaderProps {
  product: Product;
  /** Суммарное число единиц в корзине — тот же показатель, что на бейдже в шапке */
  totalCartUnits: number;
  onCopyArticle: () => void;
  onClose: () => void;
}

export function ProductHeader({
  product,
  // totalCartUnits,
  onCopyArticle,
  onClose,
}: ProductHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Link href={ROUTES.PRODUCT(product._id)} onClick={onClose} className="group block min-w-0">
          <h2
            className="font-bold font-roboto hover:text-primary truncate text-2xl leading-tight transition-colors"
            title={product.name}
          >
            {product.name}
          </h2>
        </Link>
        {product.brand && <span className="text-xs">Бренд: {product.brand}</span>}
        <div className="flex items-center gap-2">
          <span className="text-xs" title={`Артикул: ${product._id}`}>
            Артикул: {product._id}
          </span>
          <button
            onClick={onCopyArticle}
            className="text-primary cursor-pointer hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            aria-label="Копировать артикул"
            type="button"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        {/* {totalCartUnits > 0 ? (
          <Link
            href={ROUTES.CART}
            onClick={onClose}
            className="text-primary mt-2 inline-flex max-w-full items-center gap-2 rounded-lg text-sm font-medium hover:underline"
            title={`В корзине: ${totalCartUnits}`}
          >
            <span className="relative inline-flex shrink-0">
              <FaBasketShopping className="h-4 w-4" aria-hidden />
              <Badge
                variant="default"
                className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full p-0 text-[10px] font-bold shadow ring-2 ring-background"
              >
                {totalCartUnits}
              </Badge>
            </span>
            <span className="truncate">В корзине {totalCartUnits} шт.</span>
          </Link>
        ) : null} */}
      </div>
    </div>
  );
}
