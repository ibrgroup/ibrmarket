'use client';

import {
  ORDER_STATUS,
  OrderLineSpecs,
  OrderLineStatusBadge,
  deriveLineStatus,
  formatOrderDeliveryMethod,
  getActiveLineQuantity,
  getOrderPayableAmount,
  getOrderStatusText,
  getRemainingLineAmount,
  hasOrderLineAdjustments,
  isOrderWaitingPayment,
  isReservationExpired,
  useOrder,
  type OrderStatus,
} from '@/entities/order';
import { YooKassaOrderPayment } from '@/features/checkout';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  MapPin,
  Package,
  PackageX,
  Truck,
  XCircle,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface OrderDetailsPageProps {
  orderId: string;
}

/**
 * Страница деталей заказа
 *
 * Показывает:
 * - Статус заказа
 * - Товары (snapshot)
 * - Сумму
 * - Адрес доставки
 * - Кнопку «Оплатить» для WAITING_PAYMENT
 */
export function OrderDetailsPage({ orderId }: OrderDetailsPageProps) {
  const { data: order, isLoading, error } = useOrder(orderId);

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case ORDER_STATUS.DELIVERED:
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case ORDER_STATUS.PAID:
        return <Truck className="h-5 w-5 text-green-600" />;
      case ORDER_STATUS.CANCELLED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case ORDER_STATUS.REFUSED:
        return <PackageX className="h-5 w-5 text-orange-600" />;
      case ORDER_STATUS.WAITING_PAYMENT:
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadgeClass = (status: OrderStatus): string => {
    switch (status) {
      case ORDER_STATUS.WAITING_PAYMENT:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case ORDER_STATUS.PAID:
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case ORDER_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case ORDER_STATUS.REFUSED:
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case ORDER_STATUS.DELIVERED:
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="max-container mx-auto px-4 py-3">
        <Skeleton className="mb-6 h-10 w-40" />
        <div className="mx-auto max-w-4xl space-y-3">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-container mx-auto px-4 py-3">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/my-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к заказам
          </Link>
        </Button>
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-300" />
          <h1 className="mb-4 text-2xl font-bold">Заказ не найден</h1>
          <p className="mb-8 text-muted-foreground">
            Заказ с указанным номером не существует или был удалён
          </p>
          <Button asChild>
            <Link href="/my-orders">К моим заказам</Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = order.order_status;
  const totalAmount = getOrderPayableAmount(order);
  const originalTotal = Number(order.totalAmount ?? order.total ?? 0);
  const adjusted = hasOrderLineAdjustments(order);
  const orderNumber = order._id.slice(-8).toUpperCase();
  const isWaiting = isOrderWaitingPayment(order);
  const reservationExpired = isReservationExpired(order);

  // Получаем адрес
  const address = typeof order.delivery_address === 'object' ? order.delivery_address : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/my-orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к заказам
        </Link>
      </Button>

      <div className="space-y-3">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(status)}
                <div>
                  <CardTitle className="text-xl">Заказ {orderNumber}</CardTitle>
                  <CardDescription>
                    от{' '}
                    {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </CardDescription>
                </div>
              </div>
              <Badge className={getStatusBadgeClass(status)}>
                {getOrderStatusText(status, order.payment_type)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* Товары */}
          <Card>
            <CardHeader>
              <CardTitle>Товары в заказе</CardTitle>
              {adjusted && originalTotal > totalAmount + 0.009 ? (
                <CardDescription>
                  Часть позиций отменена или возвращена — сумма пересчитана.
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {order.products.map((item, index) => {
                const lineStatus = deriveLineStatus(item, order.order_status);
                const activeQty = getActiveLineQuantity(item, order.order_status);
                const remainingAmt = getRemainingLineAmount(item, order.order_status);
                const originalAmt = Number(item.subTotal) || item.price * item.quantity;
                const inactive = activeQty <= 0;
                return (
                <div
                  key={`${item.productId}-${index}`}
                  className={cn('flex items-center gap-4', inactive && 'opacity-70')}
                >
                  <div className="relative h-20 w-16 rounded-md overflow-auto ">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.productTitle}
                        fill
                        className={cn('object-cover', inactive && 'grayscale')}
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={cn('truncate font-medium', inactive && 'line-through')}>
                      {item.productTitle}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {activeQty < item.quantity
                        ? `${activeQty} из ${item.quantity}`
                        : item.quantity}{' '}
                      × {item.price.toLocaleString('ru-RU')} ₽
                    </p>
                    {lineStatus !== 'ACTIVE' ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <OrderLineStatusBadge status={lineStatus} reason={item.returnReason} />
                        {Number(item.refundAmount) > 0 ? (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            −{Number(item.refundAmount).toLocaleString('ru-RU')} ₽
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <OrderLineSpecs line={item} />
                  </div>
                  <div className="text-right font-medium tabular-nums">
                    <div>{remainingAmt.toLocaleString('ru-RU')} ₽</div>
                    {remainingAmt < originalAmt - 0.009 ? (
                      <div className="text-muted-foreground text-xs font-normal line-through">
                        {originalAmt.toLocaleString('ru-RU')} ₽
                      </div>
                    ) : null}
                  </div>
                </div>
                );
              })}

              <Separator />

              {Number(order.totalAmount ?? order.total ?? 0) > totalAmount + 0.009 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Сумма заказа</span>
                  <span className="text-muted-foreground tabular-nums line-through">
                    {Number(order.totalAmount ?? order.total ?? 0).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              ) : null}

              {Number(order.refundedAmount) > 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {order.order_status === ORDER_STATUS.WAITING_PAYMENT
                      ? 'Снято с заказа'
                      : 'Возвращено / отказ'}
                  </span>
                  <span className="tabular-nums text-red-600">
                    −{Number(order.refundedAmount).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between text-lg font-bold">
                <span>
                  {Number(order.totalAmount ?? order.total ?? 0) > totalAmount + 0.009
                    ? 'К оплате / остаток'
                    : 'Итого'}
                </span>
                <span className="tabular-nums">{totalAmount.toLocaleString('ru-RU')} ₽</span>
              </div>
            </CardContent>
          </Card>

          {/* Информация о доставке и оплате */}
          <div className="space-y-3">
            {/* Адрес доставки */}
            {address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {order.delivery_method === 'pickup' ? 'Самовывоз — контакты' : 'Адрес доставки'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex justify-between text-sm">
                    <span className="text-muted-foreground">Способ получения</span>
                    <span>{formatOrderDeliveryMethod(order.delivery_method)}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {address.address && <p>{address.address}</p>}
                    {address.city && <p>{address.city}</p>}
                    {address.zipCode && <p>Индекс: {address.zipCode}</p>}
                    {address.phone && <p>Тел: {address.phone}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Информация об оплате */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Оплата
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Способ оплаты</span>
                  <span>
                    {order.payment_type === 'ON_DELIVERY'
                      ? 'При получении'
                      : order.paymentId
                        ? 'ЮKassa'
                        : 'Онлайн'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Статус</span>
                  <Badge className={getStatusBadgeClass(status)}>
                    {getOrderStatusText(status, order.payment_type)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Кнопка оплаты */}
            {isWaiting && (
              <Card>
                <CardContent className="pt-6">
                  {reservationExpired ? (
                    <div className="text-center">
                      <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-yellow-500" />
                      <p className="mb-2 text-sm font-medium">Резерв истёк</p>
                      <p className="text-xs text-muted-foreground">
                        Время резервирования товаров истекло. Пожалуйста, оформите заказ заново.
                      </p>
                    </div>
                  ) : (
                    order && <YooKassaOrderPayment orderId={order._id} disabled={false} />
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
