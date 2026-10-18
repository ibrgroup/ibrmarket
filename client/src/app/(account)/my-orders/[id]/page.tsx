'use client';

import { OrderDetailsPage } from '@/views/account/my-orders/[id]/OrderDetailsPage';
import { use } from 'react';

export default function OrderDetailsPageRoute({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <OrderDetailsPage orderId={resolvedParams.id} />;
}
