import { SearchPage } from '@/views/search/SearchPage';
import { getBaseUrl } from '@/shared/config/site';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Поиск товаров',
  description:
    'Поиск по каталогу IBR Market. Найдите нужный товар по названию, категории или бренду.',
  openGraph: {
    title: 'Поиск товаров | IBR Market',
    url: `${getBaseUrl()}/search`,
    type: 'website',
  },
  alternates: {
    canonical: `${getBaseUrl()}/search`,
  },
  robots: { index: true, follow: true },
};

export default function SearchPageRoute() {
  return <SearchPage />;
}
