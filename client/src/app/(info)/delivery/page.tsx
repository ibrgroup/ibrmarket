import { getBaseUrl } from '@/shared/config/site';
import Delivery from '@/views/info/delivery/DeliveryPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Доставка',
  description: 'Условия доставки ibrmarket: способы, сроки, стоимость. Доставка по России и СНГ.',
  openGraph: {
    title: 'Доставка | ibrmarket',
    url: `${getBaseUrl()}/delivery`,
    type: 'website',
  },
  alternates: {
    canonical: `${getBaseUrl()}/delivery`,
  },
  robots: { index: true, follow: true },
};

export default function DeliveryPageRoute() {
  return <Delivery />;
}
