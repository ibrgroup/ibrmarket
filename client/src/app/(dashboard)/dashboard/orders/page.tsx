import { AdminOrdersPage } from '@/features/admin-data';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense
      fallback={<p className="text-muted-foreground px-1 py-8 text-sm">Загрузка заказов…</p>}
    >
      <AdminOrdersPage />
    </Suspense>
  );
}
