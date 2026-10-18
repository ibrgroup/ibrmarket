import { CheckoutPage } from '@/views/checkout/CheckoutPage';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function CheckoutPageRoute() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16">Загрузка...</div>}>
      <CheckoutPage />
    </Suspense>
  );
}
