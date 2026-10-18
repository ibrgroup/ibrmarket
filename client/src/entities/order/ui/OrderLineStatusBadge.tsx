'use client';

import type { OrderItemLineStatus } from '@/entities/order/lib/order-line-return';
import { getLineStatusLabel } from '@/entities/order/lib/order-line-return';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';

const VARIANT: Record<OrderItemLineStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'secondary',
  PARTIAL: 'outline',
  RETURNED: 'destructive',
  REFUSED: 'destructive',
  CANCELLED: 'destructive',
};

export function OrderLineStatusBadge({
  status,
  reason,
  hideActive = false,
  className,
}: {
  status: OrderItemLineStatus;
  reason?: string;
  hideActive?: boolean;
  className?: string;
}) {
  if (hideActive && status === 'ACTIVE') return null;
  return (
    <Badge variant={VARIANT[status] ?? 'secondary'} className={cn('w-fit', className)}>
      {getLineStatusLabel(status, reason)}
    </Badge>
  );
}
