'use client';

import { usePaymentMethods, usePaymentStatus } from '@/shared/store/payment';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Check, CreditCard, Eye, EyeOff, Lock, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { SettingsErrorAlert, SettingsPageSkeleton } from '../SettingsFeedback';
import { SettingsPageHeader } from '../SettingsPageHeader';

export function PaymentMethodsPage() {
  const { methods: paymentMethods, actions: paymentMethodsActions } = usePaymentMethods();
  const { isLoading, error, clearError } = usePaymentStatus();

  const [showCardNumber, setShowCardNumber] = useState<Record<string, boolean>>({});

  useEffect(() => {
    paymentMethodsActions.fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCardNumberVisibility = (id: string) => {
    setShowCardNumber((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const maskedCardNumber = (number: string) => {
    if (number.length < 16) return number;
    return `${number.slice(0, 4)} **** **** ${number.slice(-4)}`;
  };

  if (isLoading) return <SettingsPageSkeleton />;
  if (error) {
    return <SettingsErrorAlert message={error} onDismiss={clearError} />;
  }

  return (
    <div className="max-container mx-auto px-4 py-3 sm:py-3">
      <SettingsPageHeader
        icon={CreditCard}
        title="Способы оплаты"
        description="Сохранённые карты ЮKassa и способ оплаты по умолчанию"
        backHref="/settings"
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-4 transition-all">
            <CardHeader>
              <CardTitle className="font-roboto text-xl font-bold">Сохранённые карты</CardTitle>
              <CardDescription>
                Карты привязываются через ЮKassa после оплаты — мы не храним полный номер карты.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="py-10 text-center">
                  <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="font-roboto mb-2 text-xl font-semibold sm:text-2xl">
                    Нет сохранённых карт
                  </h3>
                  <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
                    Оформите заказ онлайн и отметьте «Сохранить карту» при оплате — или карта
                    появится после успешной оплаты.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card/50 p-4 transition-all hover:border-border sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3 sm:items-center">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium text-foreground">
                              {showCardNumber[method.id]
                                ? `${method.brand} ****${method.lastFour}`
                                : maskedCardNumber(`${'0'.repeat(12)}${method.lastFour}`)}
                            </h3>
                            {method.isDefault && (
                              <Badge variant="secondary" className="text-xs font-normal">
                                По умолчанию
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Истекает: {method.expiryMonth}/{method.expiryYear}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>Токен ЮKassa, не полный номер</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => toggleCardNumberVisibility(method.id)}
                        >
                          {showCardNumber[method.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => paymentMethodsActions.setDefault(method.id)}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            По умолчанию
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить способ оплаты?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Карта будет удалена из профиля. При необходимости вы сможете снова
                                сохранить её при следующей оплате.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => paymentMethodsActions.delete(method.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="p-4">
            <CardHeader>
              <CardTitle className="font-roboto text-xl font-semibold">
                Как добавить карту
              </CardTitle>
              <CardDescription>
                Добавление только через защищённую оплату ЮKassa — так требует PCI DSS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
                <li>Добавьте товары в корзину и перейдите к оформлению.</li>
                <li>Выберите оплату картой и при необходимости отметьте «Сохранить карту».</li>
                <li>После успешной оплаты карта появится в этом списке.</li>
              </ol>
              <Button className="h-11 w-full" asChild>
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-4 w-4" />В каталог
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
