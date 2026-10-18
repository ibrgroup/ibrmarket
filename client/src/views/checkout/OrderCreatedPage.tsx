'use client';

import {
  deriveLineStatus,
  formatOrderDeliveryMethod,
  getActiveLineQuantity,
  getOrderPayableAmount,
  getOrderStatusText,
  getRemainingLineAmount,
  isOrderPayOnDelivery,
  isReservationExpired,
  ORDER_STATUS,
  OrderLineStatusBadge,
  useOrder,
} from '@/entities/order';
import { YooKassaOrderPayment } from '@/features/checkout';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Loader2,
  Package,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface OrderCreatedPageProps {
  orderId: string;
}

/**
 * Страница созданного заказа
 *
 * Показывает:
 * - Информацию о заказе
 * - Статус заказа
 * - Кнопку «Оплатить»
 *
 * После нажатия «Оплатить» — редирект на YooKassa
 */
export function OrderCreatedPage({ orderId }: OrderCreatedPageProps) {
  const { data: order, isLoading, error } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Загрузка заказа...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-6">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <h1 className="mb-4 text-2xl font-bold">Заказ не найден</h1>
          <p className="mb-3 text-muted-foreground">
            Заказ с указанным номером не существует или был удалён
          </p>
          <Button asChild>
            <Link href="/products">Вернуться в каталог</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isWaitingPayment = order.order_status === ORDER_STATUS.WAITING_PAYMENT;
  const isPaid = order.order_status === ORDER_STATUS.PAID;
  const isCancelled = order.order_status === ORDER_STATUS.CANCELLED;
  const payOnDelivery = isOrderPayOnDelivery(order);
  const reservationExpired = isReservationExpired(order);

  const totalAmount = getOrderPayableAmount(order);

  return (
    <div className="min-h-screen py-3 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="px-4">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-3">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href="/my-orders">
                <ArrowLeft className="mr-2 h-4 w-4" />К моим заказам
              </Link>
            </Button>

            <div className="flex p-3 rounded-2xl bg-card items-center gap-4">
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-full',
                  isWaitingPayment && 'bg-yellow-100 dark:bg-yellow-900/30',
                  isPaid && 'bg-green-100 dark:bg-green-900/30',
                  isCancelled && 'bg-red-100 dark:bg-red-900/30',
                )}
              >
                {isWaitingPayment && (
                  <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                )}
                {isPaid && <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />}
                {isCancelled && <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-roboto font-bold">
                  {isWaitingPayment && 'Заказ создан'}
                  {isPaid && !payOnDelivery && 'Заказ оплачен'}
                  {isPaid && payOnDelivery && 'Заказ оформлен'}
                  {isCancelled && 'Заказ отменён'}
                </h1>
                <p className="text-muted-foreground">Заказ {order._id.slice(-8).toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Products Card */}
          <Card className="mb-3">
            <CardHeader>
              <CardTitle className="text-xl font-roboto">
                Товары ({order.products.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.products.map((item, index) => {
                  const lineStatus = deriveLineStatus(item, order.order_status);
                  const activeQty = getActiveLineQuantity(item, order.order_status);
                  const remainingAmt = getRemainingLineAmount(item, order.order_status);
                  return (
                    <div key={`${item.productId}-${index}`} className="flex items-center gap-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.productTitle}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.productTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {activeQty < item.quantity
                            ? `${activeQty} из ${item.quantity}`
                            : item.quantity}{' '}
                          × {item.price.toLocaleString('ru-RU')} ₽
                        </p>
                        <OrderLineStatusBadge
                          status={lineStatus}
                          reason={item.returnReason}
                          hideActive
                          className="mt-1"
                        />
                      </div>
                      <div className="font-medium">{remainingAmt.toLocaleString('ru-RU')} ₽</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Order Info Card */}
          <Card className="mb-3">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-roboto gap-2">
                <Package className="h-5 w-5" />
                Информация о заказе
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Статус</span>
                <Badge
                  className={
                    isWaitingPayment
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : isPaid
                        ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400'
                        : isCancelled
                          ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                          : ''
                  }
                >
                  {getOrderStatusText(order.order_status, order.payment_type)}
                </Badge>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Получение</span>
                <span>{formatOrderDeliveryMethod(order.delivery_method)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Дата создания</span>
                <span>
                  {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between text-xl font-bold font-roboto">
                <span>Итого</span>
                <span>{totalAmount.toLocaleString('ru-RU')} ₽</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isWaitingPayment && (
            <Card>
              <CardContent className="pt-6">
                {reservationExpired ? (
                  <div className="text-center">
                    <div className="mb-4 flex justify-center">
                      <AlertTriangle className="h-12 w-12 text-yellow-500" />
                    </div>
                    <p className="mb-2 font-medium">Резерв истёк</p>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Время резервирования товаров истекло. Пожалуйста, оформите заказ заново.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/cart">Вернуться в корзину</Link>
                    </Button>
                  </div>
                ) : (
                  <YooKassaOrderPayment orderId={order._id} disabled={false} />
                )}
              </CardContent>
            </Card>
          )}

          {isPaid && (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                <p className="mb-2 font-medium">
                  {payOnDelivery ? 'Заказ принят — оплата при получении' : 'Заказ успешно оплачен!'}
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  {payOnDelivery
                    ? 'Сумму нужно будет оплатить курьеру при доставке'
                    : 'Мы начали обработку вашего заказа'}
                </p>
                <Button asChild>
                  <Link href="/my-orders">Мои заказы</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {isCancelled && (
            <Card>
              <CardContent className="pt-6 text-center">
                <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <p className="mb-2 font-medium">Заказ отменён</p>
                <p className="mb-4 text-sm text-muted-foreground">К сожалению, заказ был отменён</p>
                <Button asChild>
                  <Link href="/products">Вернуться в каталог</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
