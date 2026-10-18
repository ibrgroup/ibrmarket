'use client';

import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { CheckCircle, Package, Truck, Clock } from 'lucide-react';
import Link from 'next/link';

export function OrderSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Card className="text-center">
          <CardContent className="py-12 pt-12">
            <div className="mb-8">
              <CheckCircle className="mx-auto mb-4 h-20 w-20 text-green-500" />
              <h1 className="mb-4 text-3xl font-bold text-gray-900">Заказ успешно оформлен!</h1>
              <p className="text-lg text-gray-600">
                Спасибо за покупку! Ваш заказ принят в обработку.
              </p>
            </div>

            <div className="mb-8 rounded-lg bg-gray-50 p-6 text-left">
              <h3 className="mb-4 font-medium">Что происходит дальше?</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Обработка заказа</p>
                    <p className="text-sm text-gray-600">
                      Мы проверим наличие товаров и подготовим заказ к отправке
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Доставка</p>
                    <p className="text-sm text-gray-600">
                      Курьер доставит заказ в удобное время в течение 1-2 дней
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Получение</p>
                    <p className="text-sm text-gray-600">
                      Вы получите уведомление о доставке за 1 час до прибытия курьера
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button size="lg" className="w-full" asChild>
                <Link href="/my-orders">Отследить заказ</Link>
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" asChild>
                  <Link href="/products">Продолжить покупки</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/my-account">Личный кабинет</Link>
                </Button>
              </div>
            </div>

            <div className="mt-8 border-t pt-8 text-sm text-gray-600">
              <p className="mb-2">По вопросам заказа обращайтесь:</p>
              <p>
                📞 +7 (800) 123-45-67
                <br />📧 support@ibr-market.ru
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
