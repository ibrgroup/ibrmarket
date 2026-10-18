import { OrderSuccessPage } from '@/views/account/my-orders/success/OrderSuccessPage';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function OrderSuccessPageRoute() {
  return (
    <Suspense fallback={<div className="max-container mx-auto px-4 py-3">Загрузка...</div>}>
      <OrderSuccessPage />
    </Suspense>
  );
}
