import { PaymentSuccessPage } from '@/views/checkout/PaymentSuccessPage';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function PaymentSuccessPageRoute() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16">Загрузка...</div>}>
      <PaymentSuccessPage />
    </Suspense>
  );
}
