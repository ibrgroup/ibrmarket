'use client';

import { useAuth } from '@/features/auth';
import { canAccessAdminSegment } from '@/shared/lib/admin-permissions';
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ADMIN_NAV } from '@/widgets/dashboard-admin/config/nav';
import Link from 'next/link';
import { useMemo } from 'react';

/**
 * Карточки разделов на /dashboard с учётом роли.
 */
export function AdminOverviewSectionCards() {
  const { user } = useAuth();
  const sections = useMemo(
    () =>
      ADMIN_NAV.filter(
        (item) => item.segment !== 'overview' && canAccessAdminSegment(user?.role, item.segment),
      ),
    [user?.role],
  );

  if (sections.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        У вашей роли пока нет дополнительных разделов в панели. Обратитесь к администратору для
        расширения прав.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {sections.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} prefetch className="group block rounded-2xl">
            <Card className="ring-border h-full transition-[box-shadow,transform] group-hover:ring-primary/20 group-hover:shadow-md group-active:scale-[0.99]">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <div className="bg-primary/10 text-primary rounded-xl p-2 transition-colors group-hover:bg-primary/15">
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  <CardDescription className="mt-1.5">{item.blurb}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
