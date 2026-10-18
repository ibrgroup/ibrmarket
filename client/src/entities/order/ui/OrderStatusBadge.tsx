'use client';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import {
  getOrderStatusColor,
  getOrderStatusText,
  type OrderPaymentType,
  type OrderStatus,
} from '../model/types';

const STATUS_BADGE_CLASS: Record<ReturnType<typeof getOrderStatusColor>, string> = {
  yellow: 'border-amber-900/40 bg-amber-900/10 text-amber-950 dark:text-amber-100',
  green: 'border-emerald-500/40 bg-emerald-500/50 text-white dark:text-emerald-100',
  red: 'border-red-500/40 bg-red-500/10 text-red-950 dark:text-red-100',
  blue: 'border-sky-500/40 bg-sky-500/10 text-sky-950 dark:text-sky-100',
  orange: 'border-orange-500/40 bg-orange-500/10 text-orange-950 dark:text-orange-100',
};

export function OrderStatusBadge({
  status,
  paymentType,
  className,
}: {
  status: OrderStatus;
  paymentType?: OrderPaymentType | string | null;
  className?: string;
}) {
  const tone = getOrderStatusColor(status);
  const label = getOrderStatusText(status, paymentType ?? undefined);
  return (
    <Badge variant="outline" className={cn('font-normal', STATUS_BADGE_CLASS[tone], className)}>
      {label}
    </Badge>
  );
}
