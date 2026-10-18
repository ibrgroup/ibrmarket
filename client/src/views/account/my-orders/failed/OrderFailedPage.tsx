'use client';

import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { XCircle, RefreshCw, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

export function OrderFailedPage() {
  return (
    <div className="max-container mx-auto px-4 py-3">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-8">
          <XCircle className="mx-auto mb-4 h-20 w-20 text-red-600" />
          <h1 className="mb-4 text-3xl font-bold text-red-600">Ошибка оформления заказа</h1>
          <p className="mb-4 text-gray-600">
            К сожалению, не удалось обработать ваш заказ. Это может быть связано с проблемами оплаты
            или техническими неполадками.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold">Возможные причины:</h3>
            <ul className="space-y-2 text-left text-sm text-gray-600">
              <li>• Недостаточно средств на карте</li>
              <li>• Ошибка в данных карты</li>
              <li>• Проблемы с банковским сервисом</li>
              <li>• Технические неполадки на сервере</li>
            </ul>
          </CardContent>
        </Card>

        <div className="mb-8 space-y-4">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/checkout">
              <RefreshCw className="mr-2 h-4 w-4" />
              Попробовать снова
            </Link>
          </Button>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button variant="outline" asChild>
              <a href="tel:+74951234567">
                <Phone className="mr-2 h-4 w-4" />
                Позвонить в поддержку
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:support@ibr-market.ru">
                <Mail className="mr-2 h-4 w-4" />
                Написать в поддержку
              </a>
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            Если проблема повторяется, свяжитесь с нашей поддержкой:
            <br />
            <strong>Телефон:</strong> +7 (495) 123-45-67
            <br />
            <strong>Email:</strong> support@ibr-market.ru
            <br />
            <strong>Время работы:</strong> Пн-Пт 9:00-18:00
          </p>
        </div>
      </div>
    </div>
  );
}
