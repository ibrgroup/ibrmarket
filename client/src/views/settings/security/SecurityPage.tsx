'use client';

import { usePaymentSecurity, usePaymentStatus } from '@/shared/store/payment';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { Clock, Info, Key, Lock, Shield } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { SettingsErrorAlert, SettingsPageSkeleton } from '../SettingsFeedback';
import { SettingsPageHeader } from '../SettingsPageHeader';

export function SecurityPage() {
  const { settings, actions } = usePaymentSecurity();
  const { isLoading, error, clearError } = usePaymentStatus();

  useEffect(() => {
    actions.fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAcknowledgeOtpOnly = () => {
    toast.info('Вход по OTP', {
      description:
        'Пароль не используется. Войдите с одноразовым кодом на email или телефон — экран «Войти».',
    });
  };

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  if (error) {
    return <SettingsErrorAlert message={error} onDismiss={clearError} />;
  }

  return (
    <div className="max-container mx-auto px-4 py-3 sm:py-3">
      <SettingsPageHeader
        icon={Shield}
        title="Безопасность"
        description="Управление настройками безопасности вашей учётной записи"
        backHref="/settings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border/80 p-3 transition-all">
            <CardHeader>
              <CardTitle className="font-roboto flex items-center text-xl">
                <Lock className="mr-2 h-5 w-5 shrink-0 text-primary" />
                Пароль
              </CardTitle>
              <CardDescription>
                Смена пароля недоступна. Используется вход по OTP на email или телефон.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100">
                Пароли не хранятся. Вход выполняется по одноразовому коду на email или телефон.
              </div>
              <div className="mt-4 text-right">
                <Button className="w-full md:w-fit" type="button" onClick={onAcknowledgeOtpOnly}>
                  Понятно
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 transition-all">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="font-roboto flex items-center text-xl">
                  <Shield className="mr-2 h-5 w-5 shrink-0 text-primary" />
                  Двухфакторная аутентификация
                </CardTitle>
                <Badge variant="secondary" className="font-normal">
                  Скоро
                </Badge>
              </div>
              <CardDescription>
                Переключатель сохраняет ваше пожелание. Подключение приложения-аутентификатора
                появится в обновлении — вход по-прежнему через OTP.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground">Запланировать 2FA</h3>
                  <p className="text-sm text-muted-foreground">
                    Сообщите нам, что хотите усилить защиту аккаунта приложением вроде Google
                    Authenticator
                  </p>
                </div>
                <Switch
                  checked={settings.twoFactorEnabled}
                  onCheckedChange={(v) => actions.update({ twoFactorEnabled: v })}
                  className="shrink-0"
                />
              </div>

              {settings.twoFactorEnabled && (
                <Alert className="mt-6 border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-50">
                  <Info className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                  <AlertTitle className="text-sky-950 dark:text-sky-50">
                    Предпочтение сохранено
                  </AlertTitle>
                  <AlertDescription className="text-sky-900/90 dark:text-sky-100/90">
                    Настройка QR-кода и проверка кодов при входе будут доступны позже. Сейчас вы
                    входите только через OTP. При необходимости отключите переключатель выше.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="transition-all p-4">
            <CardHeader>
              <CardTitle className="font-roboto flex flex-wrap items-center gap-2 text-xl">
                <Clock className="h-5 w-5 shrink-0 text-primary" />
                Журнал активности
                <Badge variant="secondary" className="font-normal">
                  Скоро
                </Badge>
              </CardTitle>
              <CardDescription>История входов и устройств</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Данные готовятся</AlertTitle>
                <AlertDescription>
                  Здесь появится лента входов и действий в аккаунте. Пока используйте переключатели
                  уведомлений ниже — они уже работают и сохраняются в профиле.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className='p-4'>
            <CardHeader>
              <CardTitle className="font-roboto flex items-center text-xl">
                <Key className="mr-2 h-5 w-5 shrink-0 text-primary" />
                Уведомления о безопасности
              </CardTitle>
              <CardDescription>Email при важных событиях в аккаунте</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/60">
                <div className="flex items-center justify-between gap-3 py-4 first:pt-0">
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground">Новые входы</h3>
                    <p className="text-sm text-muted-foreground">
                      Уведомления о новых устройствах и сессиях
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.newLogins}
                    onCheckedChange={(v) =>
                      actions.update({ notifications: { ...settings.notifications, newLogins: v } })
                    }
                    className="shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground">Способы оплаты</h3>
                    <p className="text-sm text-muted-foreground">
                      При добавлении или удалении карт в профиле
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.paymentMethodChanges}
                    onCheckedChange={(v) =>
                      actions.update({
                        notifications: { ...settings.notifications, paymentMethodChanges: v },
                      })
                    }
                    className="shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-4">
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground">Подозрительная активность</h3>
                    <p className="text-sm text-muted-foreground">
                      Нестандартные действия в учётной записи
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.suspiciousActivity}
                    onCheckedChange={(v) =>
                      actions.update({
                        notifications: { ...settings.notifications, suspiciousActivity: v },
                      })
                    }
                    className="shrink-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
