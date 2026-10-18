import { PaymentFailedPage } from '@/views/checkout/PaymentFailedPage';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function PaymentFailedPageRoute() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16">Загрузка...</div>}>
      <PaymentFailedPage />
    </Suspense>
  );
}
