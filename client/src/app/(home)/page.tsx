import { HomePage } from '@/views/home/HomePage';
import { getBaseUrl, SITE_DESCRIPTION_SHORT, SITE_NAME } from '@/shared/config/site';
import { prefetchHomePageData } from '@/shared/lib/prefetch';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Интернет-магазин',
  description: SITE_DESCRIPTION_SHORT,
  openGraph: {
    title: `${SITE_NAME} — Интернет-магазин`,
    description: SITE_DESCRIPTION_SHORT,
    url: getBaseUrl(),
    type: 'website',
  },
  alternates: {
    canonical: getBaseUrl(),
  },
  robots: { index: true, follow: true },
};

/**
 * Server Component для главной страницы
 * Prefetch данные на сервере для устранения подергиваний при hydration
 */
export default async function Home() {
  // Prefetch данные на сервере
  const dehydratedState = await prefetchHomePageData();

  return <HomePage dehydratedState={dehydratedState} />;
}
