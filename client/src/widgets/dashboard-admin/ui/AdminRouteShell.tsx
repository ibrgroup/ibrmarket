'use client';

import { useAuth } from '@/features/auth';
import { hasDashboardAccess } from '@/shared/lib/user-roles';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { DashboardShell } from './DashboardShell';

type Props = {
  children: ReactNode;
};

/**
 * Client-side gate: profile is the source of truth for role when JWT is not readable on this host.
 */
export function AdminRouteShell({ children }: Props) {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated) return;
    const q = new URLSearchParams({ auth: 'required', redirect: '/dashboard' });
    router.replace(`/?${q.toString()}`);
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return (
      <DashboardShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 max-w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardShell>
        <p className="text-muted-foreground text-sm">Перенаправление на вход…</p>
      </DashboardShell>
    );
  }

  if (!hasDashboardAccess(user?.role)) {
    return (
      <DashboardShell>
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Нет доступа</CardTitle>
            <CardDescription>
              Панель доступна сотрудникам магазина (роли персонала). Обычные покупатели здесь не
              авторизуются.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/">На главную</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/my-account">Мой профиль</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
