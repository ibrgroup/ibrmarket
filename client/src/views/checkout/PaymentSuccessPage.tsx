'use client';

import { ORDER_STATUS, useOrder } from '@/entities/order';
import { orderService } from '@/shared/api/services/order-service';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ArrowRight, CheckCircle2, Clock, Home, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef } from 'react';

/**
 * Страница возврата после оплаты
 *
 * Показывает статус заказа:
 * - PAID → Заказ оплачен (успех)
 * - WAITING_PAYMENT → Ожидание подтверждения оплаты
 * - CANCELLED → Заказ отменён
 */
const POLL_INTERVAL_MS = 2500;
const POLL_MAX_ATTEMPTS = 60; // ~2.5 минуты

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId');

  const { data: order, isLoading, error, refetch } = useOrder(orderId ?? undefined, !!orderId);
  const pollCountRef = useRef(0);

  const syncAndRefetch = useCallback(async () => {
    if (!orderId) return;
    try {
      await orderService.syncPayment(orderId);
      await refetch();
    } catch {
      await refetch();
    }
  }, [orderId, refetch]);

  // Сразу при загрузке заказа в WAITING_PAYMENT — один раз синхронизируем с ЮKassa (webhook мог не дойти)
  useEffect(() => {
    if (!orderId || !order || order.order_status !== ORDER_STATUS.WAITING_PAYMENT) return;
    syncAndRefetch();
  }, [orderId, order?.order_status, syncAndRefetch]);

  // Опрос: синхронизация с ЮKassa и refetch каждые 2.5 с, пока статус WAITING_PAYMENT
  useEffect(() => {
    if (!orderId || !order || order.order_status !== ORDER_STATUS.WAITING_PAYMENT) return;
    if (pollCountRef.current >= POLL_MAX_ATTEMPTS) return;

    const timer = setInterval(() => {
      pollCountRef.current += 1;
      syncAndRefetch();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [orderId, order?.order_status, syncAndRefetch]);

  useEffect(() => {
    pollCountRef.current = 0;
  }, [orderId]);

  // Если нет orderId — показываем общее сообщение об успехе (старое поведение)
  if (!orderId) {
    return <LegacySuccessView />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Проверяем статус заказа...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <Clock className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
          <h1 className="mb-4 text-2xl font-bold">Проверяем оплату</h1>
          <p className="mb-8 text-muted-foreground">
            Подождите, мы проверяем статус вашего платежа. Это может занять несколько минут.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/my-orders">Мои заказы</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">На главную</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = order.order_status === ORDER_STATUS.PAID;
  const isWaiting = order.order_status === ORDER_STATUS.WAITING_PAYMENT;
  const isCancelled = order.order_status === ORDER_STATUS.CANCELLED;

  if (isPaid) {
    return <PaidView orderId={order._id} />;
  }

  if (isWaiting) {
    return <WaitingView orderId={order._id} />;
  }

  if (isCancelled) {
    return <CancelledView />;
  }

  // Delivered или другой статус — показываем как успех
  return <PaidView orderId={order._id} />;
}

/**
 * Заказ оплачен
 */
function PaidView({ orderId }: { orderId: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/my-orders');
    }, 10000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl text-green-900 dark:text-green-100">
              Заказ оплачен!
            </CardTitle>
            <CardDescription className="text-lg">Мы начали обработку вашего заказа</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Что дальше?</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>Мы получили ваш платеж и начали обработку заказа</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>На ваш email будет отправлено подтверждение</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>Отслеживайте статус в личном кабинете</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href={`/my-orders/${orderId}`}>
                  Детали заказа
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  На главную
                </Link>
              </Button>
            </div>

            <p className="text-muted-foreground text-center text-xs">
              Вы будете перенаправлены к заказам через 10 секунд
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Ожидание подтверждения оплаты
 */
function WaitingView({ orderId }: { orderId: string }) {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Card className="border-yellow-200 bg-indigo-100/50 dark:bg-yellow-950/20">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500 dark:bg-yellow-900">
              <Clock className="h-10 w-10 text-white dark:text-yellow-400" />
            </div>
            <CardTitle className="text-3xl font-roboto">Ожидаем подтверждение оплаты</CardTitle>
            <CardDescription className="text-md">
              Платёж обрабатывается. Это может занять несколько минут
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Что происходит?</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-indigo-500" />
                  <span>Платёжная система обрабатывает ваш платёж</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-muted-foreground">•</span>
                  <span>Обычно это занимает от нескольких секунд до 5 минут</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-muted-foreground">•</span>
                  <span>Статус заказа обновится автоматически</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1 rounded-2xl h-13">
                <Link href={`/checkout/order/${orderId}`}>
                  Проверить статус
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1 h-13 shadow-none rounded-2xl">
                <Link href="/my-orders">Мои заказы</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Заказ отменён
 */
function CancelledView() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-3xl text-red-900 dark:text-red-100">Заказ отменён</CardTitle>
            <CardDescription className="text-lg">
              К сожалению, оплата не прошла или была отменена
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Что делать?</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Проверьте баланс карты и попробуйте оформить заказ заново</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Попробуйте использовать другой способ оплаты</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Если проблема сохраняется, свяжитесь с поддержкой</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href="/cart">Вернуться в корзину</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/products">
                  <Home className="mr-2 h-4 w-4" />В каталог
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Старый вид (без orderId) для обратной совместимости
 */
function LegacySuccessView() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 10000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl text-green-900 dark:text-green-100">
              Оплата успешно выполнена!
            </CardTitle>
            <CardDescription className="text-lg">Ваш заказ успешно оплачен</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Что дальше?</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Мы получили ваш платеж и начали обработку заказа</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>На ваш email будет отправлено подтверждение заказа</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Вы можете отслеживать статус заказа в личном кабинете</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href="/my-orders">
                  Мои заказы
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  На главную
                </Link>
              </Button>
            </div>

            <p className="text-muted-foreground text-center text-xs">
              Вы будете перенаправлены на главную страницу через 10 секунд
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
