'use client';

import {
  getOrderStatusText,
  getSelectableOrderStatuses,
  isTerminalOrderStatus,
  type OrderPaymentType,
  type OrderStatus,
} from '@/entities/order';
import { cn } from '@/shared/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

type OrderStatusSelectProps = {
  value: OrderStatus;
  paymentType?: OrderPaymentType | string | null;
  onValueChange: (status: OrderStatus) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  size?: 'sm' | 'default';
};

export function OrderStatusSelect({
  value,
  paymentType,
  onValueChange,
  disabled,
  className,
  triggerClassName,
  size = 'default',
}: OrderStatusSelectProps) {
  const options = getSelectableOrderStatuses(value);
  const terminal = isTerminalOrderStatus(value);

  return (
    <Select
      value={value}
      disabled={disabled || terminal}
      onValueChange={(v) => {
        if (v !== value) onValueChange(v as OrderStatus);
      }}
    >
      <SelectTrigger
        className={cn(
          'bg-muted/50',
          size === 'sm' && 'h-8 min-w-[160px]',
          triggerClassName,
          className,
        )}
        size={size === 'sm' ? 'sm' : undefined}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((s) => (
          <SelectItem key={s} value={s}>
            {getOrderStatusText(s, paymentType ?? undefined)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
