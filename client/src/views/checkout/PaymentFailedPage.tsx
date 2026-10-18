'use client';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Страница неуспешной оплаты
 */
export function PaymentFailedPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-3xl text-red-900 dark:text-red-100">
              Оплата не выполнена
            </CardTitle>
            <CardDescription className="text-lg">
              К сожалению, произошла ошибка при обработке платежа
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">Возможные причины:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Недостаточно средств на карте</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Банк отклонил транзакцию</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Истек срок действия QR-кода</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Техническая ошибка платежной системы</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => router.back()} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Вернуться назад
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/checkout">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Попробовать снова
                </Link>
              </Button>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:bg-yellow-950/20">
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                <strong>Важно:</strong> Если деньги были списаны, но платеж не прошел, они будут
                возвращены на ваш счет в течение 1-3 рабочих дней. Если проблема сохраняется,
                обратитесь в службу поддержки.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
