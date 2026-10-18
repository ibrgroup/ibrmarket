import { getBaseUrl } from '@/shared/config/site';
import ContactsPage from '@/views/info/contacts/ContactsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Контакты',
  description:
    'Связаться с IBR Market: адрес, телефон, email. Ответим на вопросы по заказам и доставке.',
  openGraph: {
    title: 'Контакты | IBR Market',
    url: `${getBaseUrl()}/contacts`,
    type: 'website',
  },
  alternates: {
    canonical: `${getBaseUrl()}/contacts`,
  },
  robots: { index: true, follow: true },
};

export default function ContactsPageRoute() {
  return <ContactsPage />;
}
