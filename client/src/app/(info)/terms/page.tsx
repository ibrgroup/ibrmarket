import { getBaseUrl } from '@/shared/config/site';
import TermsOfUse from '@/views/info/terms/TermsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Условия использования',
  description: 'Пользовательское соглашение и условия использования сайта IBR Market.',
  openGraph: {
    title: 'Условия использования | IBR Market',
    url: `${getBaseUrl()}/terms`,
    type: 'website',
  },
  alternates: {
    canonical: `${getBaseUrl()}/terms`,
  },
  robots: { index: true, follow: true },
};

export default function TermsPageRoute() {
  return <TermsOfUse />;
}
