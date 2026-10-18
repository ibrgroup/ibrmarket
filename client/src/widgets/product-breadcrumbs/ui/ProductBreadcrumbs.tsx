'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/shared/ui/button';
import { useProduct } from '@/entities/product';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb';

interface ProductBreadcrumbsProps {
  productId: string;
  showBackButton?: boolean;
}

export function ProductBreadcrumbs({ productId, showBackButton = true }: ProductBreadcrumbsProps) {
  const { product, loading, error } = useProduct(productId);
  const displayProduct = useMemo(() => product, [product]);

  return (
    <div className="max-container m-auto relative">
      <div className="flex md:block hidden py-3 z-100 w-fullflex-wrap items-center justify-baseline gap-4">
        {showBackButton && (
          <Button variant="ghost" size="sm" asChild>
       
          </Button>
        )}
        <Breadcrumb>
          <BreadcrumbList className='text-xs '>
            <BreadcrumbItem >
              <BreadcrumbLink asChild>
                <Link href="/">Главная</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/products">Каталог</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {displayProduct ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/products?category=${
                        displayProduct.category?.slug || displayProduct.catName
                      }`}
                    >
                      {displayProduct.category?.name || displayProduct.catName || 'Категория'}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {displayProduct.brand && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href={`/products?brand=${encodeURIComponent(displayProduct.brand)}`}>
                          {displayProduct.brand}
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{loading ? 'Загрузка...' : displayProduct.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : error ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Товар не найден</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Загрузка...</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
