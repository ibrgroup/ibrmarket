'use client';

import { OrderLineSpecs } from '@/entities/order';
import {
  ORDER_ITEM_RETURN_REASON,
  type OrderItemReturnReason,
  getActiveLineQuantity,
  getReturnReasonLabel,
} from '@/entities/order/lib/order-line-return';
import type { OrderProduct } from '@/entities/order/model/types';
import { formatRub } from '@/shared/lib/format-money';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: OrderProduct;
  onConfirm: (payload: { quantity: number; reason: OrderItemReturnReason }) => void;
  busy?: boolean;
  orderStatus?: string;
  paymentType?: string | null;
};

export function AdminOrderItemReturnDialog({
  open,
  onOpenChange,
  line,
  onConfirm,
  busy,
  orderStatus,
  paymentType,
}: Props) {
  const maxQty = getActiveLineQuantity(line);
  const unpaid = orderStatus === 'WAITING_PAYMENT';
  const onlinePaid =
    !unpaid && paymentType !== 'ON_DELIVERY' && (orderStatus === 'PAID' || orderStatus === 'DELIVERED');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState<OrderItemReturnReason>(ORDER_ITEM_RETURN_REASON.RETURNED);

  useEffect(() => {
    if (!open) return;
    setQuantity(String(Math.max(1, maxQty)));
    setReason(unpaid ? ORDER_ITEM_RETURN_REASON.CANCELLED : ORDER_ITEM_RETURN_REASON.RETURNED);
  }, [open, maxQty, line.productId, unpaid]);

  const qtyNum = Math.max(1, parseInt(quantity, 10) || 1);
  const unitPrice =
    line.quantity > 0 ? (line.subTotal || line.price * line.quantity) / line.quantity : line.price;
  const refundPreview = Math.round(unitPrice * Math.min(qtyNum, maxQty) * 100) / 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{unpaid ? 'Отмена позиции' : 'Возврат позиции'}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1">
              <p className="line-clamp-2">{line.productTitle}</p>
              <OrderLineSpecs line={line} />
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-muted-foreground text-sm">
            Доступно: <span className="text-foreground font-medium">{maxQty}</span> из {line.quantity}
          </p>

          <div className="space-y-2">
            <Label htmlFor="return-qty">Количество</Label>
            <Input
              id="return-qty"
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              className='bg-gray-100'
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Причина</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as OrderItemReturnReason)}>
              <SelectTrigger className='bg-gray-100'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ORDER_ITEM_RETURN_REASON).map((r) => (
                  <SelectItem key={r} value={r}>
                    {getReturnReasonLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm">
            Сумма:{' '}
            <span className="text-foreground font-medium tabular-nums">
              {formatRub(refundPreview)}
            </span>
          </p>
          <p className="text-muted-foreground text-xs leading-snug">
            {unpaid
              ? 'Заказ ещё не оплачен: позиция снимется с заказа, товар вернётся на склад. Незавершённый платёж ЮKassa будет отменён — клиент сможет оплатить остаток.'
              : onlinePaid
                ? 'Сумма вернётся на карту через ЮKassa. Обычно это несколько минут, иногда до нескольких дней у банка.'
                : 'Онлайн-оплаты не было (оплата при получении): меняется только учёт заказа и склад.'}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Отмена
          </Button>
          <Button
            type="button"
            disabled={busy || maxQty <= 0 || qtyNum > maxQty || qtyNum < 1}
            onClick={() =>
              onConfirm({
                quantity: Math.min(qtyNum, maxQty),
                reason,
              })
            }
          >
            {unpaid ? 'Отменить' : 'Оформить возврат'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
