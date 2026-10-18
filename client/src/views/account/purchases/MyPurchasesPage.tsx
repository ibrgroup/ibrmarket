'use client';

import {
  countOrdersWaitingPayment,
  formatOrderDeliveryMethod,
  OrderLineStatusBadge,
  ordersToPurchaseLines,
  useOrders,
} from '@/entities/order';
import { OrderStatusBadge } from '@/entities/order/ui/OrderStatusBadge';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { AlertCircle, ChevronRight, Package, Search, ShoppingBag, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

function matchesPurchaseSearch(
  line: ReturnType<typeof ordersToPurchaseLines>[number],
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    line.productTitle,
    line.brand,
    line.size,
    line.color,
    line.productId,
    line.orderId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

/**
 * Страница «Мои покупки»: товары из оплаченных и доставленных заказов (позиции, а не только номера заказов).
 */
export function MyPurchasesPage() {
  const { data: orders = [], isLoading, error } = useOrders(true);
  const [searchQuery, setSearchQuery] = useState('');
  const lines = ordersToPurchaseLines(orders);
  const filteredLines = useMemo(
    () => lines.filter((line) => matchesPurchaseSearch(line, searchQuery)),
    [lines, searchQuery],
  );
  const waitingCount = countOrdersWaitingPayment(orders);

  if (isLoading) {
    return (
      <div className="max-container m-auto py-3">
        <div className="mb-3 flex flex-col gap-2 rounded-2xl bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Skeleton className="mb-3 h-11 w-full max-w-md rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent>
                <Skeleton className="mb-3 h-98 aspect-square w-full rounded-2xl" />
                <Skeleton className="mb-2 h-98" />
                <Skeleton className="h-98" />
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
          <XCircle className="mx-auto mb-4 h-16 w-16 text-destructive/40" />
          <h1 className="mb-4 text-2xl font-bold text-foreground">Ошибка загрузки</h1>
          <p className="mb-8 text-muted-foreground">Не удалось загрузить покупки</p>
          <Button onClick={() => window.location.reload()}>Попробовать снова</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-container m-auto py-3">
      <div className="mb-3 flex flex-col gap-3 rounded-2xl bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-roboto text-2xl font-bold">Мои покупки</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Товары из заказов, в том числе отменённые и возвращённые позиции.
          </p>
        </div>
        <Button variant="outline" asChild className="border-none shadow-none bg-gray-50 hover:bg-gray-100 transition-all shrink-0 gap-1 rounded-xl">
          <Link href="/my-orders">
            Все заказы
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {lines.length > 0 ? (
        <div className="relative mb-3 max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по покупкам"
            className="h-11 rounded-xl border-border bg-background pl-10"
            aria-label="Поиск по покупкам"
          />
        </div>
      ) : null}

      {waitingCount > 0 ? (
        <Card className="mb-3 border-amber-200/80 p-0 rounded-2xl bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-amber-950 dark:text-amber-100">
                  {waitingCount === 1
                    ? 'Один заказ ждёт оплаты'
                    : `${waitingCount} заказов ждут оплаты`}
                </p>
                <p className="text-sm text-amber-900/80 dark:text-amber-200/80">
                  Перейдите к заказам, чтобы оплатить или отменить бронь.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0 rounded-xl">
              <Link href="/my-orders">К заказам</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {lines.length === 0 ? (
        <div className="rounded-2xl bg-card px-4 py-16 text-center">
          <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground/40" />
          <h2 className="mb-2 text-xl font-bold text-foreground">Покупок пока нет</h2>
          <p className="mb-8 text-muted-foreground">
            После оплаты заказа товары появятся здесь. Неоплаченные заказы — в разделе «Все заказы».
          </p>
          <Button asChild>
            <Link href="/products">Перейти в каталог</Link>
          </Button>
        </div>
      ) : filteredLines.length === 0 ? (
        <div className="rounded-2xl bg-card px-4 py-12 text-center">
          <Search className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <h2 className="mb-2 text-lg font-semibold">Ничего не найдено</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            По запросу «{searchQuery.trim()}» покупок нет. Попробуйте другое название или артикул.
          </p>
          <Button variant="outline" onClick={() => setSearchQuery('')}>
            Сбросить поиск
          </Button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {searchQuery.trim()
              ? `${filteredLines.length} из ${lines.length} позиций`
              : `${lines.length} ${lines.length === 1 ? 'позиция' : lines.length < 5 ? 'позиции' : 'позиций'}`}
          </p>
          <div className="grid gap-0.5 md:gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {filteredLines.map((line) => {
              const order = orders.find((o) => o._id === line.orderId);
              const orderShort = line.orderId.slice(-8).toUpperCase();
              const inactive = line.quantity <= 0;
              const partial = line.quantity > 0 && line.quantity < line.originalQuantity;
              return (
                <Card
                  key={line.key}
                  className={cn('overflow-hidden p-0', inactive && 'opacity-80')}
                >
                  <CardContent className="p-0">
                    <Link
                      href={`/product/${line.productId}`}
                      className="block outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                    >
                      <div className="relative w-full overflow-hidden bg-muted">
                        {line.image ? (
                          <img
                            src={line.image}
                            alt={line.productTitle}
                            className={cn('h-full w-full object-cover', inactive && 'grayscale')}
                          />
                        ) : (
                          <div className="flex h-full min-h-[120px] items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-col gap-1">
                          <OrderStatusBadge
                            status={line.orderStatus}
                            paymentType={order?.payment_type}
                            className="text-xs shadow-sm"
                          />
                          <OrderLineStatusBadge
                            status={line.lineStatus}
                            reason={line.returnReason}
                            hideActive
                            className="text-xs shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 p-4">
                        <h3
                          className={cn(
                            'line-clamp-2 min-h-[2.5rem] font-bold text-sm leading-snug',
                            inactive && 'line-through text-muted-foreground',
                          )}
                        >
                          {line.productTitle}
                        </h3>
                        {(line.brand || line.size || line.color) && (
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {[line.brand, line.size, line.color].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                          <span className="font-bold text-foreground">
                            {partial || inactive
                              ? `${line.quantity} из ${line.originalQuantity} × ${line.price.toLocaleString('ru-RU')} ₽`
                              : `${line.quantity} × ${line.price.toLocaleString('ru-RU')} ₽`}
                          </span>
                          <span className="font-roboto text-xl font-bold text-primary">
                            {line.subTotal.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                        {line.subTotal < line.originalSubTotal - 0.009 ? (
                          <p className="text-xs text-muted-foreground line-through tabular-nums">
                            {line.originalSubTotal.toLocaleString('ru-RU')} ₽
                          </p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {new Date(line.orderCreatedAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {order?.delivery_method
                            ? ` · ${formatOrderDeliveryMethod(order.delivery_method)}`
                            : ''}
                        </p>
                      </div>
                    </Link>
                    <div className="border-t px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full justify-between px-2"
                        asChild
                      >
                        <Link href={`/my-orders/${line.orderId}`}>
                          Заказ {orderShort}
                          <ChevronRight className="h-4 w-4 opacity-60" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
