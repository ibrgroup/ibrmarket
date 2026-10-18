import { OrderFailedPage } from '@/views/account/my-orders/failed/OrderFailedPage';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function OrderFailedPageRoute() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Загрузка...</div>}>
      <OrderFailedPage />
    </Suspense>
  );
}
