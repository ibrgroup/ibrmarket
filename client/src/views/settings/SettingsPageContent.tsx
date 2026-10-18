'use client';

import { useAuth } from '@/features/auth';
import { SignInPrompt } from '@/features/auth-modal';
import { useTheme } from '@/shared/hooks';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import {
  Bell,
  CreditCard,
  Monitor,
  Moon,
  Palette,
  Settings as SettingsIcon,
  Shield,
  Sun,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { SettingsPageHeader } from './SettingsPageHeader';

export function SettingsPageContent() {
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const { theme, setTheme, actualTheme, isLoading: themeLoading } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Предотвращаем рендер до монтирования для избежания гидратационных несоответствий
  if (!mounted) {
    return (
      <div className="max-container mx-auto px-4 py-3">
        <Skeleton className="mb-4 h-10 w-48" />
        <Skeleton className="mb-3 h-11 w-full max-w-lg rounded-xl" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="mt-2 h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Предотвращаем рендер до загрузки темы
  if (themeLoading) {
    return (
      <div className="max-container mx-auto px-4 py-3">
        <Skeleton className="mb-4 h-10 w-48" />
        <Skeleton className="mb-3 h-11 w-full max-w-lg rounded-xl" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <SignInPrompt
        title="Необходимо войти"
        description="Войдите в аккаунт, чтобы получить доступ к настройкам"
        intent={{ type: 'profile' }}
      />
    );
  }

  return (
    <div className="max-container mx-auto px-4 py-3 sm:py-3">
      <SettingsPageHeader
        icon={SettingsIcon}
        title="Настройки"
        description="Оформление, уведомления и разделы оплаты — всё в одном месте"
      />
      <Tabs defaultValue="payment" className="w-full gap-3">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-gray-200 dark:bg-muted/80 p-1.5">
          <TabsTrigger
            value="payment"
            className="flex cursor-pointer items-center gap-1.5 px-2 py-2.5 text-xs shadow-none sm:gap-2 sm:py-3 sm:text-sm"
          >
            <CreditCard className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Оплата</span>
            <span className="sm:hidden">Платёж</span>
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="flex cursor-pointer items-center gap-1.5 px-2 py-2.5 text-xs shadow-none sm:gap-2 sm:py-3 sm:text-sm"
          >
            <Palette className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Внешний вид</span>
            <span className="sm:hidden">Вид</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex cursor-pointer items-center gap-1.5 px-2 py-2.5 text-xs shadow-none sm:gap-2 sm:py-3 sm:text-sm"
          >
            <Bell className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Уведомления</span>
            <span className="sm:hidden">Уведомл</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-0">
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="font-roboto flex items-center gap-2 text-xl sm:text-2xl">
                <Palette className="h-5 w-5 shrink-0 text-primary" />
                Внешний вид
              </CardTitle>
              <CardDescription>Настройте тему и внешний вид приложения</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="font-roboto mb-1 text-lg font-semibold sm:text-xl">Тема</h3>
                  <p className="text-sm text-muted-foreground">
                    Выберите предпочтительную тему оформления
                  </p>
                </div>

                <RadioGroup
                  value={theme}
                  onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <RadioGroupItem value="light" id="light" className="peer sr-only" />
                  <Label
                    htmlFor="light"
                    tabIndex={0}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none sm:p-4',
                      theme === 'light' && 'border-primary ring-2 ring-primary/30',
                    )}
                  >
                    <Sun className="h-5 w-5 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">Светлая</div>
                      <div className="truncate text-xs text-muted-foreground">
                        Светлый интерфейс в любое время суток
                      </div>
                    </div>
                  </Label>

                  <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                  <Label
                    htmlFor="dark"
                    tabIndex={0}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none sm:p-4',
                      theme === 'dark' && 'border-primary ring-2 ring-primary/30',
                    )}
                  >
                    <Moon className="h-5 w-5 shrink-0 text-sky-500" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">Тёмная</div>
                      <div className="truncate text-xs text-muted-foreground">
                        Меньше бликов при слабом освещении
                      </div>
                    </div>
                  </Label>

                  <RadioGroupItem value="system" id="system" className="peer sr-only" />
                  <Label
                    htmlFor="system"
                    tabIndex={0}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none sm:col-span-2 sm:p-4',
                      theme === 'system' && 'border-primary ring-2 ring-primary/30',
                    )}
                  >
                    <Monitor className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">Как в системе</div>
                      <div className="truncate text-xs text-muted-foreground">
                        Следовать настройкам устройства
                      </div>
                    </div>
                  </Label>
                </RadioGroup>

                <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium sm:text-base">Текущая тема</div>
                      <div className="truncate text-xs text-muted-foreground sm:text-sm">
                        {theme === 'light' && 'Светлая тема активна'}
                        {theme === 'dark' && 'Тёмная тема активна'}
                        {theme === 'system' &&
                          `Системная тема (${actualTheme === 'light' ? 'светлая' : 'тёмная'})`}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs capitalize sm:text-sm">
                      {actualTheme}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="font-roboto flex items-center gap-2 text-xl sm:text-2xl">
                <Bell className="h-5 w-5 shrink-0 text-primary" />
                Уведомления
              </CardTitle>
              <CardDescription>
                То, что уже можно настроить, и то, что подключим позже
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-muted/35 p-5 transition-colors hover:bg-muted/50">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Shield className="h-5 w-5 shrink-0 text-primary" />
                  <h3 className="font-roboto text-lg font-semibold sm:text-xl">
                    Безопасность и платежи
                  </h3>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  Email-уведомления о входах, картах и подозрительной активности — в разделе
                  безопасности. Настройки сохраняются в вашем профиле.
                </p>
                <Button asChild>
                  <Link href="/settings/security">Открыть настройки</Link>
                </Button>
              </div>
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Bell className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <h3 className="font-roboto text-lg font-semibold">Push и SMS</h3>
                  <Badge variant="secondary" className="text-xs font-normal">
                    Скоро
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Мгновенные push в браузере и приложении, а также SMS о статусе заказа появятся в
                  следующих обновлениях. Следите за новостями магазина.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-0">
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="font-roboto flex items-center gap-2 text-xl sm:text-2xl">
                <CreditCard className="h-5 w-5 shrink-0 text-primary" />
                Оплата и безопасность
              </CardTitle>
              <CardDescription>
                Карты, история платежей и параметры безопасности аккаунта
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
                <div className="flex flex-col rounded-2xl border border-border/60 bg-muted/35 p-5 transition-colors hover:bg-muted/50">
                  <h3 className="font-roboto mb-1 text-lg font-semibold">Способы оплаты</h3>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    Сохранённые карты и способ по умолчанию
                  </p>
                  <Button className="w-full sm:w-auto" asChild>
                    <Link href="/settings/payment-methods">Управление</Link>
                  </Button>
                </div>
                <div className="flex flex-col rounded-2xl border border-border/60 bg-muted/35 p-5 transition-colors hover:bg-muted/50">
                  <h3 className="font-roboto mb-1 text-lg font-semibold">Безопасность</h3>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    Уведомления и параметры защиты аккаунта
                  </p>
                  <Button className="w-full sm:w-auto" asChild>
                    <Link href="/settings/security">Настроить</Link>
                  </Button>
                </div>
                <div className="flex flex-col rounded-2xl border border-border/60 bg-muted/35 p-5 transition-colors hover:bg-muted/50">
                  <h3 className="font-roboto mb-1 text-lg font-semibold">История платежей</h3>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    Список операций и переход к заказам
                  </p>
                  <Button className="w-full sm:w-auto" asChild>
                    <Link href="/settings/payment-history">Просмотреть</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
