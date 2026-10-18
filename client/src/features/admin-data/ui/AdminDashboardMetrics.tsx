'use client';

import { useAuth } from '@/features/auth';
import { adminMetricsService } from '@/shared/api/services/admin-metrics-service';
import { ADMIN_PERM, canAccessAdminPermission } from '@/shared/lib/admin-permissions';
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { useQuery } from '@tanstack/react-query';

export function AdminDashboardMetrics() {
  const { user } = useAuth();
  const enabled = canAccessAdminPermission(user?.role, ADMIN_PERM.FINANCE);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: () => adminMetricsService.getMetrics(),
    staleTime: 60_000,
    enabled,
  });

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="bg-muted h-4 w-24 rounded" />
              <div className="bg-muted mt-2 h-8 w-16 rounded" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-muted-foreground text-sm">
        Не удалось загрузить метрики. Нужен доступ персонала к API /api/admin/metrics.
      </p>
    );
  }

  const items = [
    { title: 'Заказов всего', value: data.ordersTotal },
    { title: 'Заказов сегодня (UTC)', value: data.ordersToday },
    { title: 'Пользователей', value: data.usersTotal },
    { title: 'Товаров', value: data.productsTotal },
    {
      title: 'Выручка (PAID)',
      value: `${Math.round(data.revenuePaid).toLocaleString('ru-RU')} ₽`,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.title} className="shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">{item.title}</CardDescription>
            <CardTitle className="text-xl tabular-nums sm:text-2xl">{item.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
