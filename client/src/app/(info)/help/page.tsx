
import { getBaseUrl } from '@/shared/config/site';
import HelpPage from '@/views/info/help/HelpPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Помощь',
  description:
    'Помощь и часто задаваемые вопросы IBR Market: оформление заказа, доставка, оплата, возврат.',
  openGraph: {
    title: 'Помощь | IBR Market',
    url: `${getBaseUrl()}/help`,
    type: 'website',
  },
  alternates: {
    canonical: `${getBaseUrl()}/help`,
  },
  robots: { index: true, follow: true },
};

export default function HelpPageRoute() {
  return <HelpPage />;
}
