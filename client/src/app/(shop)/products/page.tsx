import { ProductsPage } from '@/views/products/ProductsPage';
import { ProductCardSkeleton } from '@/views/products/components';
import { getBaseUrl } from '@/shared/config/site';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Каталог товаров',
  description:
    'Каталог товаров IBR Market. Широкий ассортимент, фильтры по категориям и брендам, удобный поиск. Покупайте выгодно.',
  openGraph: {
    title: 'Каталог товаров | IBR Market',
    description:
      'Каталог товаров IBR Market. Широкий ассортимент, фильтры по категориям и брендам.',
    url: `${getBaseUrl()}/products`,
    type: 'website',
  },
  alternates: {
    canonical: `${getBaseUrl()}/products`,
  },
  robots: { index: true, follow: true },
};

export default function ProductsPageRoute() {
  return (
    <Suspense
      fallback={
        <div className="max-container mx-auto px-4 py-3">
          <div className="grid grid-cols-2 gap-0.5 md:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        </div>
      }
    >
      <ProductsPage />
    </Suspense>
  );
}
