'use client';

import { useAuth } from '@/features/auth';
import { canAccessAdminPath } from '@/shared/lib/admin-permissions';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type Props = { children: ReactNode };

/**
 * Ограничивает контент страниц /dashboard/* по роли (навигация фильтруется отдельно).
 */
export function DashboardAccessGate({ children }: Props) {
  const pathname = usePathname() ?? '';
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return <>{children}</>;
  }

  if (!canAccessAdminPath(user?.role, pathname)) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Нет доступа к разделу</CardTitle>
          <CardDescription>
            Для вашей роли этот раздел недоступен. Обратитесь к администратору, если нужны
            дополнительные права.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">На обзор</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
