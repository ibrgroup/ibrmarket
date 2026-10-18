'use client';

import {
  ORDER_STATUS,
  OrderLineStatusBadge,
  deriveLineStatus,
  formatOrderDeliveryMethod,
  getActiveLineQuantity,
  getOrderPayableAmount,
  getOrderStatusText,
  getRemainingLineAmount,
  hasOrderLineAdjustments,
  isOrderWaitingPayment,
  useOrders,
  type OrderStatus,
} from '@/entities/order';
import {
  getProductColorVisual,
  getProductSizeLabel,
  usePopularProducts,
  useProductRailActions,
} from '@/entities/product';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { ProductCarouselSection } from '@/widgets/product-carousel';
import { CheckCircle, Clock, CreditCard, Package, PackageX, Truck, XCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * Страница списка заказов пользователя
 *
 * Статусы:
 * - WAITING_PAYMENT → жёлтый
 * - PAID → зелёный
 * - DELIVERED → синий
 * - REFUSED → оранжевый
 * - CANCELLED → красный
 */
export function MyOrdersPage() {
  const { data: orders = [], isLoading, error } = useOrders(true);
  const { data: popularRail = [] } = usePopularProducts(20);
  const rail = useProductRailActions();

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
      <div className="max-container m-auto py-3">
        <div className="mb-3 flex items-center justify-between rounded-2xl bg-white p-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-44" />
                      <Skeleton className="h-4 w-52" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="-mx-1 flex gap-3 overflow-hidden pb-2 pt-1">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="w-[132px] flex-shrink-0 space-y-2">
                      <Skeleton className="h-[100px] w-[132px] rounded-2xl" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <Skeleton className="h-7 w-44" />
                </div>
                <div className="mt-3 flex gap-3">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-300" />
          <h1 className="mb-4 text-2xl font-bold">Ошибка загрузки</h1>
          <p className="mb-8 text-gray-600">Не удалось загрузить список заказов</p>
          <Button onClick={() => window.location.reload()}>Попробовать снова</Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <>
        <div className=" mx-auto px-4 py-8">
          <div className="text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h1 className="mb-4 text-2xl font-bold">Заказов пока нет</h1>
            <p className="mb-8 text-gray-600">Оформите первый заказ, чтобы увидеть его здесь</p>
            <Button asChild>
              <Link href="/products">Перейти к покупкам</Link>
            </Button>
          </div>
        </div>
        <div className="container mx-auto px-4 pb-12">
          <ProductCarouselSection
            title="Популярные товары"
            subtitle="Идеи для первого заказа"
            products={popularRail}
            onAddToCart={rail.onAddToCart}
            onToggleWishlist={rail.onToggleWishlist}
            isInWishlist={rail.isInWishlist}
            isInCart={rail.isInCart}
          />
        </div>
      </>
    );
  }

  return (
    <div className="max-container py-3 m-auto">
      {/* Заголовок и количество заказов */}
      <div className="mb-3 flex flex-col gap-2 rounded-2xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-roboto text-2xl font-bold">Мои заказы</h1>
          <p className="text-sm text-muted-foreground">
            Список купленных товаров — в разделе{' '}
            <Link href="/purchases" className="font-medium text-indigo-500 hover:underline">
              Мои покупки
            </Link>
            .
          </p>
        </div>
        <p className="shrink-0 text-sm text-gray-600">{orders.length} заказов</p>
      </div>

      {/* Список заказов */}
      <div className="space-y-3">
        {orders.map((order) => {
          const totalAmount = getOrderPayableAmount(order);
          const originalTotal = Number(order.totalAmount ?? order.total ?? 0);
          const orderId = order._id;
          const orderNumber = orderId.slice(-8).toUpperCase();
          const status = order.order_status;
          const adjusted = hasOrderLineAdjustments(order);

          return (
            <Card key={orderId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  {/* Левый блок - статус и название заказа */}
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status)}
                    <div>
                      <CardTitle className="text-lg font-roboto">Заказ {orderNumber}</CardTitle>
                      <CardDescription>
                        от{' '}
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {' · '}
                        {formatOrderDeliveryMethod(order.delivery_method)}
                      </CardDescription>
                    </div>
                  </div>
                  {/* Статус в виде бейджа */}
                  <Badge className={getStatusBadgeClass(status)}>
                    {getOrderStatusText(status, order.payment_type)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {/* Товары */}
                <div className="space-y-4">
                  <div
                    className="mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]"
                    role="list"
                    aria-label="Товары в заказе"
                  >
                    {order.products.map((item, index) => {
                      const lineStatus = deriveLineStatus(item, order.order_status);
                      const activeQty = getActiveLineQuantity(item, order.order_status);
                      const inactive = activeQty <= 0;
                      return (
                        <div
                          key={`${item.productId}-${index}`}
                          className={cn(
                            'w-52 flex-shrink-0 snap-start text-xs',
                            inactive && 'opacity-60',
                          )}
                          role="listitem"
                        >
                          {item.image ? (
                            <div className="relative">
                              <p
                                className={cn(
                                  'absolute left-2 top-2 z-10 w-fit rounded-md px-2 py-0.5 font-roboto text-xs font-bold text-white',
                                  inactive ? 'bg-red-600' : 'bg-pink-500',
                                )}
                              >
                                {inactive
                                  ? '0 шт.'
                                  : activeQty < item.quantity
                                    ? `${activeQty} из ${item.quantity}`
                                    : `${activeQty} шт.`}
                              </p>
                              <img
                                src={item.image}
                                alt={item.productTitle}
                                className={cn(
                                  'w-full rounded-2xl object-cover',
                                  inactive && 'grayscale',
                                )}
                              />
                            </div>
                          ) : (
                            <div className="flex h-[100px] w-[132px] items-center justify-center rounded-2xl bg-gray-100">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="mt-1 min-w-0 space-y-1">
                            <p className="font-roboto text-base font-bold leading-tight">
                              {inactive ? (
                                <span className="text-muted-foreground line-through">
                                  {(
                                    Number(item.subTotal) || item.price * item.quantity
                                  ).toLocaleString('ru-RU')}{' '}
                                  ₽
                                </span>
                              ) : (
                                <span className="text-indigo-500">
                                  {getRemainingLineAmount(item, order.order_status).toLocaleString(
                                    'ru-RU',
                                  )}{' '}
                                  ₽
                                </span>
                              )}
                            </p>
                            <p className={cn('truncate text-sm', inactive && 'line-through')}>
                              {item.productTitle}
                            </p>
                            <OrderLineStatusBadge
                              status={lineStatus}
                              reason={item.returnReason}
                              hideActive
                              className="text-[10px]"
                            />
                            {(item.size || item.color) && (
                              <p className="truncate text-xs text-muted-foreground">
                                {[
                                  item.size ? getProductSizeLabel(item.size) : null,
                                  item.color ? getProductColorVisual(item.color).label : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ИТОГО */}
                  <div className="border-t pt-4">
                    {adjusted && originalTotal > totalAmount + 0.009 ? (
                      <p className="mb-1 text-sm text-muted-foreground">
                        Часть позиций отменена или возвращена.{' '}
                        <span className="line-through tabular-nums">
                          {originalTotal.toLocaleString('ru-RU')} ₽
                        </span>
                      </p>
                    ) : null}
                    <div className="text-xl font-roboto font-bold">
                      <span className="mr-2">
                        {adjusted && originalTotal > totalAmount + 0.009 ? 'Остаток:' : 'Итого:'}
                      </span>
                      <span className="text-pink-500">{totalAmount.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex flex-wrap gap-3 mt-3">
                    <Button className='border-none bg-gray-100' variant="outline" asChild>
                      <Link href={`/my-orders/${orderId}`}>Подробнее</Link>
                    </Button>

                    {isOrderWaitingPayment(order) && (
                      <Button asChild>
                        <Link href={`/checkout/order/${orderId}`}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Оплатить
                        </Link>
                      </Button>
                    )}

                    {status === ORDER_STATUS.DELIVERED && (
                      <Button variant="outline">Оставить отзыв</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 px-0 sm:px-1">
        <ProductCarouselSection
          title="Популярные товары"
          subtitle="Вам может понравиться"
          products={popularRail}
          onAddToCart={rail.onAddToCart}
          onToggleWishlist={rail.onToggleWishlist}
          isInWishlist={rail.isInWishlist}
          isInCart={rail.isInCart}
        />
      </div>
    </div>
  );
}
