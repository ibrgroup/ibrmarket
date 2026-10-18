'use client';

import { OrderCreatedPage } from '@/views/checkout/OrderCreatedPage';
import { useParams } from 'next/navigation';

export default function CheckoutOrderPage() {
  const params = useParams();
  const rawId = params?.id;
  const orderId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? (rawId[0] ?? '') : '';

  return <OrderCreatedPage orderId={orderId} />;
}
