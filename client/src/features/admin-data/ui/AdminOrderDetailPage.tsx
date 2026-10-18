'use client';

import {
  canPartialReturnOrderStatus,
  deriveLineStatus,
  formatOrderDeliveryMethod,
  formatOrderNumber,
  formatOrderPaymentType,
  getActiveLineQuantity,
  getOrderCustomerLabel,
  getOrderLineId,
  getOrderPayableAmount,
  getRemainingLineAmount,
  OrderLineSpecs,
  OrderLineStatusBadge,
  type DeliveryAddress,
  type Order,
  type OrderProduct,
  type OrderStatus,
} from '@/entities/order';
import { adminOrderService } from '@/shared/api/services/admin-order-service';
import {
  ADMIN_PERM,
  useAdminPermission,
  useIsSuperAdmin,
} from '@/shared/hooks/use-admin-permission';
import { formatRub } from '@/shared/lib/format-money';
import { roleLabelRu } from '@/shared/lib/user-roles';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import {
  ADMIN_TABLE_HEADER_ROW,
  ADMIN_TABLE_ORDER_LINES,
} from '@/widgets/dashboard-admin/lib/admin-table-classes';
import { AdminPageHeader } from '@/widgets/dashboard-admin/ui/AdminPageHeader';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ExternalLink, Package } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdminOrderItemReturnDialog } from './AdminOrderItemReturnDialog';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderStatusSelect } from './OrderStatusSelect';

function strField(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function formatAddressType(raw: string | undefined | null): string | null {
  const t = strField(raw);
  if (!t) return null;
  const map: Record<string, string> = {
    Home: 'Дом',
    Office: 'Офис',
    home: 'Дом',
    office: 'Офис',
    HOME: 'Дом',
    OFFICE: 'Офис',
  };
  return map[t] ?? t;
}

function deliveryAddressRows(
  delivery: Order['delivery_address'],
): { label: string; value: string }[] {
  if (!delivery) return [];
  if (typeof delivery === 'string') {
    return delivery.trim() ? [{ label: 'Адрес', value: delivery.trim() }] : [];
  }
  const o = delivery as DeliveryAddress;
  const rows: { label: string; value: string }[] = [];
  const recipient = strField(o.name);
  if (recipient) rows.push({ label: 'Получатель', value: recipient });
  const street = strField(o.address_line1) ?? strField(o.address);
  if (street) rows.push({ label: 'Адрес', value: street });
  const locality = strField(o.locality);
  if (locality) rows.push({ label: 'Район', value: locality });
  const landmark = strField(o.landmark);
  if (landmark) rows.push({ label: 'Ориентир', value: landmark });
  const type = formatAddressType(o.addressType);
  if (type) rows.push({ label: 'Тип', value: type });
  const city = strField(o.city);
  if (city) rows.push({ label: 'Город', value: city });
  const region = strField(o.state);
  if (region) rows.push({ label: 'Регион', value: region });
  const zip = strField(o.pincode) ?? strField(o.zipCode);
  if (zip) rows.push({ label: 'Индекс', value: zip });
  const country = strField(o.country);
  if (country) rows.push({ label: 'Страна', value: country });
  const phone = strField(o.mobile) ?? strField(o.phone);
  if (phone) rows.push({ label: 'Телефон получателя', value: phone });
  return rows;
}

export function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isSuperAdmin = useIsSuperAdmin();
  const canFulfillOrders = useAdminPermission(ADMIN_PERM.FULFILLMENT);
  const canChangeOrderStatus = canFulfillOrders;
  const rawId = params?.id;
  const id = typeof rawId === 'string' ? rawId : '';
  const [returnLine, setReturnLine] = useState<OrderProduct | null>(null);

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => adminOrderService.getById(id),
    enabled: Boolean(id),
  });

  const updateStatus = useMutation({
    mutationFn: (order_status: OrderStatus) => adminOrderService.updateStatus(id, order_status),
    onSuccess: () => {
      toast.success('Статус обновлён');
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Не удалось обновить статус'),
  });

  const deleteOrder = useMutation({
    mutationFn: () => adminOrderService.deleteOrder(id),
    onSuccess: () => {
      toast.success('Заказ удалён');
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      router.push('/dashboard/orders');
    },
    onError: (e: Error) => toast.error(e.message ?? 'Не удалось удалить заказ'),
  });

  const returnItem = useMutation({
    mutationFn: (payload: {
      itemId: string;
      quantity: number;
      reason: 'RETURNED' | 'REFUSED' | 'CANCELLED';
    }) => adminOrderService.returnOrderItem(id, payload.itemId, payload),
    onSuccess: () => {
      toast.success('Возврат по позиции оформлен');
      setReturnLine(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Не удалось оформить возврат'),
  });

  const canReturnItems = Boolean(order && canPartialReturnOrderStatus(order.order_status));
  const unpaidOrder = order?.order_status === 'WAITING_PAYMENT';
  const remainingTotal = order ? getOrderPayableAmount(order) : 0;
  const originalTotal = order ? Number(order.totalAmount || 0) : 0;
  const refundedTotal = order ? Number(order.refundedAmount || 0) : 0;
  const addressRows = order ? deliveryAddressRows(order.delivery_address) : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={id ? `Заказ ${formatOrderNumber(id)}` : 'Заказ'}
        description="Клиент, доставка, оплата, позиции с размером и цветом, частичный возврат."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/orders">К списку</Link>
            </Button>
            {isSuperAdmin ? (
              <Button
                variant="destructive"
                size="sm"
                type="button"
                disabled={!id || deleteOrder.isPending}
                onClick={() => {
                  if (!confirm('Удалить заказ безвозвратно?')) return;
                  deleteOrder.mutate();
                }}
              >
                Удалить
              </Button>
            ) : null}
          </div>
        }
      />

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Загрузка…</p>
      ) : isError ? (
        <p className="text-destructive text-sm">{(error as Error)?.message ?? 'Ошибка'}</p>
      ) : order ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Статус и оплата</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <OrderStatusBadge status={order.order_status} paymentType={order.payment_type} />
              <dl className="text-muted-foreground space-y-2">
                <div>
                  <dt className="text-foreground font-medium">Сумма заказа</dt>
                  <dd className="tabular-nums">{formatRub(originalTotal)}</dd>
                </div>
                {remainingTotal < originalTotal - 0.009 ? (
                  <>
                    {refundedTotal > 0 ? (
                      <div>
                        <dt className="text-foreground font-medium">
                          {unpaidOrder ? 'Снято с заказа' : 'Возвращено / отказ'}
                        </dt>
                        <dd className="tabular-nums text-red-600">−{formatRub(refundedTotal)}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-foreground font-medium">
                        {unpaidOrder ? 'К оплате' : 'К оплате / остаток'}
                      </dt>
                      <dd className="tabular-nums font-medium">{formatRub(remainingTotal)}</dd>
                    </div>
                  </>
                ) : null}
                <div>
                  <dt className="text-foreground font-medium">Создан</dt>
                  <dd>
                    {order.createdAt
                      ? format(new Date(order.createdAt), 'd MMMM yyyy, HH:mm', { locale: ru })
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-foreground font-medium">Способ получения</dt>
                  <dd>{formatOrderDeliveryMethod(order.delivery_method)}</dd>
                </div>
                <div>
                  <dt className="text-foreground font-medium">Оплата</dt>
                  <dd>{formatOrderPaymentType(order.payment_type)}</dd>
                </div>
                {order.paymentId ? (
                  <div>
                    <dt className="text-foreground font-medium">Платёж</dt>
                    <dd className="font-mono text-xs break-all">{order.paymentId}</dd>
                  </div>
                ) : null}
                {order.reservedAt ? (
                  <div>
                    <dt className="text-foreground font-medium">Резерв с</dt>
                    <dd>
                      {format(new Date(order.reservedAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
                    </dd>
                  </div>
                ) : null}
                {order.updatedAt ? (
                  <div>
                    <dt className="text-foreground font-medium">Обновлён</dt>
                    <dd>
                      {format(new Date(order.updatedAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <div className="space-y-2 border-t pt-4">
                <p className="text-foreground text-xs font-medium uppercase tracking-wide">
                  Изменить статус
                </p>
                <OrderStatusSelect
                  value={order.order_status}
                  paymentType={order.payment_type}
                  disabled={!canChangeOrderStatus || updateStatus.isPending}
                  onValueChange={(v) => updateStatus.mutate(v)}
                />
                {!canChangeOrderStatus ? (
                  <p className="text-muted-foreground text-xs">
                    Менять статус и оформлять возврат по позициям может администратор или менеджер.
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Для отказа от отдельных товаров используйте «Вернуть» в таблице позиций — заказ
                    останется в работе, пока есть активные позиции. Удаление заказа целиком — только
                    у администратора.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Клиент</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-1 text-sm">
              <p>
                <span className="text-foreground font-medium">Имя / контакт:</span>{' '}
                {getOrderCustomerLabel(order.userId)}
              </p>
              {order.userId && typeof order.userId === 'object' ? (
                <>
                  {order.userId.email ? (
                    <p>
                      <span className="text-foreground font-medium">Email:</span>{' '}
                      {order.userId.email}
                    </p>
                  ) : null}
                  {order.userId.mobile ? (
                    <p>
                      <span className="text-foreground font-medium">Телефон:</span>{' '}
                      {order.userId.mobile}
                    </p>
                  ) : null}
                  {order.userId.role ? (
                    <p>
                      <span className="text-foreground font-medium">Роль:</span>{' '}
                      {roleLabelRu(order.userId.role)}
                    </p>
                  ) : null}
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                {order.delivery_method === 'pickup' ? 'Самовывоз — контакты' : 'Адрес доставки'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {addressRows.length ? (
                <dl className="grid gap-2 sm:grid-cols-2">
                  {addressRows.map((row) => (
                    <div key={row.label}>
                      <dt className="text-foreground font-medium">{row.label}</dt>
                      <dd className="text-muted-foreground break-words">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-muted-foreground">Адрес не указан</p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Позиции заказа</CardTitle>
            </CardHeader>
            <CardContent>
              {order.products?.length ? (
                <div className="overflow-hidden rounded-xl border">
                  <Table
                    wrapperClassName="max-h-[min(50vh,420px)] overflow-auto"
                    className={ADMIN_TABLE_ORDER_LINES}
                  >
                    <TableHeader className={ADMIN_TABLE_HEADER_ROW}>
                      <TableRow>
                        <TableHead className="w-[72px]">Фото</TableHead>
                        <TableHead className="min-w-[260px]">Товар и параметры</TableHead>
                        <TableHead className="min-w-[100px]">Бренд</TableHead>
                        <TableHead className="min-w-[140px]">Статус позиции</TableHead>
                        <TableHead className="w-[100px] text-right">Цена</TableHead>
                        <TableHead className="w-[88px] text-right">Кол-во</TableHead>
                        <TableHead className="w-[100px] text-right">Сумма</TableHead>
                        {canFulfillOrders ? <TableHead className="w-[110px]" /> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.products.map((p, i) => {
                        const lineId = getOrderLineId(p, i);
                        const activeQty = getActiveLineQuantity(p, order.order_status);
                        const lineStatus = deriveLineStatus(p, order.order_status);
                        const remainingAmt = getRemainingLineAmount(p, order.order_status);
                        const originalAmt = Number(p.subTotal) || remainingAmt;
                        return (
                          <TableRow key={lineId}>
                            <TableCell className="py-2">
                              {p.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.image}
                                  alt={p.productTitle}
                                  className="size-14 rounded-lg border object-cover"
                                />
                              ) : (
                                <div className="bg-muted flex size-14 items-center justify-center rounded-lg border">
                                  <Package className="text-muted-foreground size-5" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[380px]">
                              <span className="text-foreground block font-medium leading-snug break-words">
                                {p.productTitle}
                              </span>
                              <OrderLineSpecs line={p} />
                              {p.productId ? (
                                <Link
                                  href={`/product/${p.productId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1 text-[11px]"
                                >
                                  <span className="font-mono break-all">{p.productId}</span>
                                  <ExternalLink className="size-3 shrink-0" aria-hidden />
                                  <span className="sr-only">Открыть товар на сайте</span>
                                </Link>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm leading-snug break-words">
                              {p.brand ?? '—'}
                            </TableCell>
                            <TableCell>
                              <OrderLineStatusBadge status={lineStatus} reason={p.returnReason} />
                              {Number(p.refundAmount) > 0 ? (
                                <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                                  возврат {formatRub(p.refundAmount)}
                                </p>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatRub(p.price)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {activeQty < p.quantity ? `${activeQty} / ${p.quantity}` : p.quantity}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium">
                              {formatRub(remainingAmt)}
                              {remainingAmt < originalAmt - 0.009 ? (
                                <span className="text-muted-foreground mt-0.5 block text-xs font-normal line-through">
                                  {formatRub(originalAmt)}
                                </span>
                              ) : null}
                            </TableCell>
                            {canFulfillOrders ? (
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    !canReturnItems || activeQty <= 0 || returnItem.isPending
                                  }
                                  onClick={() => setReturnLine(p)}
                                >
                                  {unpaidOrder ? 'Отменить' : 'Вернуть'}
                                </Button>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Нет позиций</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {returnLine ? (
        <AdminOrderItemReturnDialog
          open={Boolean(returnLine)}
          onOpenChange={(open) => {
            if (!open) setReturnLine(null);
          }}
          line={returnLine}
          orderStatus={order?.order_status}
          paymentType={order?.payment_type}
          busy={returnItem.isPending}
          onConfirm={({ quantity, reason }) => {
            const itemId = returnLine._id;
            if (!itemId) {
              toast.error('У позиции нет идентификатора — обновите страницу');
              return;
            }
            returnItem.mutate({ itemId, quantity, reason });
          }}
        />
      ) : null}
    </div>
  );
}
