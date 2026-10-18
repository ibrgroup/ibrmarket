'use client';

import { getOrderStatusText, type OrderStatus } from '@/entities/order';
import { useAuth } from '@/features/auth';
import {
  adminMetricsService,
  type AdminAnalytics,
} from '@/shared/api/services/admin-metrics-service';
import { ADMIN_PERM, canAccessAdminPermission } from '@/shared/lib/admin-permissions';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart';
import { Skeleton } from '@/shared/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, Minus, PackageSearch, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const PERIODS = [
  { days: 7, label: '7 дней' },
  { days: 30, label: '30 дней' },
  { days: 90, label: '90 дней' },
] as const;

const revenueChartConfig = {
  revenue: { label: 'Выручка', color: 'var(--primary)' },
} satisfies ChartConfig;

const ordersChartConfig = {
  orders: { label: 'Заказы', color: 'var(--primary)' },
} satisfies ChartConfig;

function formatRub(value: number): string {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

function formatChartDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/** Заполняет пропущенные дни нулями, чтобы график не «перепрыгивал» даты без продаж. */
function fillMissingDays(analytics: AdminAnalytics) {
  const byDate = new Map(analytics.revenueByDay.map((p) => [p.date, p]));
  const from = new Date(analytics.period.from);
  const to = new Date(analytics.period.to);
  const result: { date: string; revenue: number; orders: number }[] = [];
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  while (cursor <= to) {
    const key = cursor.toISOString().slice(0, 10);
    const point = byDate.get(key);
    result.push({ date: key, revenue: point?.revenue ?? 0, orders: point?.orders ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous <= 0) {
    return current > 0 ? (
      <Badge variant="outline" className="gap-1 text-emerald-600">
        <TrendingUp className="size-3" aria-hidden />
        новое
      </Badge>
    ) : null;
  }
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) {
    return (
      <Badge variant="outline" className="text-muted-foreground gap-1">
        <Minus className="size-3" aria-hidden />
        0%
      </Badge>
    );
  }
  const up = pct > 0;
  return (
    <Badge
      variant="outline"
      className={up ? 'gap-1 text-emerald-600' : 'gap-1 text-red-600'}
      title="Сравнение с предыдущим периодом той же длины"
    >
      {up ? (
        <ArrowUpRight className="size-3" aria-hidden />
      ) : (
        <ArrowDownRight className="size-3" aria-hidden />
      )}
      {`${up ? '+' : ''}${pct.toFixed(pct > 99 ? 0 : 1)}%`}
    </Badge>
  );
}

export function AdminAnalyticsSection() {
  const { user } = useAuth();
  const enabled = canAccessAdminPermission(user?.role, ADMIN_PERM.FINANCE);
  const [days, setDays] = useState<number>(30);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'analytics', days],
    queryFn: () => adminMetricsService.getAnalytics(days),
    staleTime: 60_000,
    enabled,
  });

  if (!enabled) return null;

  const chartData = useMemo(() => (data ? fillMissingDays(data) : []), [data]);

  const kpis = data
    ? [
        {
          title: 'Выручка за период',
          value: formatRub(data.totals.revenue),
          current: data.totals.revenue,
          previous: data.previous.revenue,
        },
        {
          title: 'Оплаченных заказов',
          value: data.totals.paidOrders.toLocaleString('ru-RU'),
          current: data.totals.paidOrders,
          previous: data.previous.paidOrders,
        },
        {
          title: 'Средний чек',
          value: formatRub(data.totals.averageOrderValue),
          current: data.totals.averageOrderValue,
          previous: data.previous.averageOrderValue,
        },
        {
          title: 'Новых пользователей',
          value: data.totals.newUsers.toLocaleString('ru-RU'),
          current: data.totals.newUsers,
          previous: data.previous.newUsers,
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">Динамика за выбранный период</p>
        <div className="border-border bg-gray-200 inline-flex w-fit rounded-lg border p-0.5">
          {PERIODS.map((p) => (
            <Button
              key={p.days}
              type="button"
              size="sm"
              variant={days === p.days ? 'default' : 'ghost'}
              className="h-7 rounded-md px-3 text-xs"
              onClick={() => setDays(p.days)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {isError ? (
        <p className="text-muted-foreground text-sm">
          Не удалось загрузить аналитику. Нужен доступ персонала к API /api/admin/analytics.
        </p>
      ) : isLoading || !data ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.title} className="shadow-sm">
                <CardHeader>
                  <CardDescription>{kpi.title}</CardDescription>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-2xl tabular-nums">{kpi.value}</CardTitle>
                    <DeltaBadge current={kpi.current} previous={kpi.previous} />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Выручка по дням</CardTitle>
                <CardDescription>Оплаченные и полученные заказы</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={revenueChartConfig} className="h-48 w-full sm:h-56">
                  <AreaChart data={chartData} margin={{ left: 4, right: 4 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={24}
                      tickFormatter={formatChartDate}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tickFormatter={(v: number) => v.toLocaleString('ru-RU')}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            const date = payload?.[0]?.payload?.date;
                            return typeof date === 'string' ? formatChartDate(date) : '';
                          }}
                          formatter={(value) => formatRub(Number(value))}
                        />
                      }
                    />
                    <Area
                      dataKey="revenue"
                      type="monotone"
                      fill="var(--color-revenue)"
                      fillOpacity={0.15}
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Заказы по дням</CardTitle>
                <CardDescription>Количество оплаченных заказов</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={ordersChartConfig} className="h-48 w-full sm:h-56">
                  <BarChart data={chartData} margin={{ left: 4, right: 4 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={24}
                      tickFormatter={formatChartDate}
                    />
                    <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            const date = payload?.[0]?.payload?.date;
                            return typeof date === 'string' ? formatChartDate(date) : '';
                          }}
                        />
                      }
                    />
                    <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Заказы по статусам</CardTitle>
                <CardDescription>За выбранный период</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.statusBreakdown.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Заказов за период нет</p>
                ) : (
                  data.statusBreakdown
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map((s) => (
                      <div key={s.status} className="flex items-center justify-between text-sm">
                        <span>{getOrderStatusText(s.status as OrderStatus)}</span>
                        <span className="font-medium tabular-nums">{s.count}</span>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Топ товаров</CardTitle>
                <CardDescription>По количеству продаж за период</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.topProducts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Продаж за период нет</p>
                ) : (
                  data.topProducts.map((p) => (
                    <div key={p.productId} className="flex items-center gap-3">
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt=""
                          width={36}
                          height={36}
                          className="size-9 shrink-0 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="bg-muted size-9 shrink-0 rounded-md" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {p.quantity} шт · {formatRub(p.revenue)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Заканчиваются на складе</CardTitle>
                  <CardDescription className="mt-1.5">Остаток 5 шт и меньше</CardDescription>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/catalog?tab=products">
                    <PackageSearch className="size-4" aria-hidden />
                    Каталог
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.lowStock.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Все товары в достатке</p>
                ) : (
                  data.lowStock.map((p) => (
                    <div key={p.productId} className="flex items-center gap-3">
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt=""
                          width={36}
                          height={36}
                          className="size-9 shrink-0 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="bg-muted size-9 shrink-0 rounded-md" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="text-muted-foreground text-xs">
                          остаток {p.countInStock} шт · {formatRub(p.price)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          p.countInStock === 0 ? 'shrink-0 text-red-600' : 'shrink-0 text-amber-600'
                        }
                      >
                        {p.countInStock === 0 ? 'Нет' : `${p.countInStock} шт`}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
