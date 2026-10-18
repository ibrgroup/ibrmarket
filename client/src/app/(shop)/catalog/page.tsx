import { getBaseUrl } from '@/shared/config/site';
import { CatalogPage } from '@/views/catalog/CatalogPage';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Каталог категорий',
  description:
    'Каталог категорий IBR Market. Выберите категорию и подкатегорию для просмотра товаров.',
  openGraph: {
    title: 'Каталог категорий | IBR Market',
    description:
      'Каталог категорий IBR Market. Выберите категорию и подкатегорию для просмотра товаров.',
    url: `${getBaseUrl()}/catalog`,
    type: 'website',
  },
  alternates: {
    canonical: `${getBaseUrl()}/catalog`,
  },
  robots: { index: true, follow: true },
};

export default function CatalogPageRoute() {
  return (
    <Suspense fallback={<div className="max-container mx-auto px-4 py-4">Загрузка…</div>}>
      <CatalogPage />
    </Suspense>
  );
}
