import { decodeToken, isTokenExpired } from '@/shared/lib/auth';
import { isApiCrossOriginFromHost } from '@/shared/lib/request-origin';
import { hasDashboardAccess } from '@/shared/lib/user-roles';
import { AdminRouteShell } from '@/widgets/dashboard-admin';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Админ-панель',
  robots: { index: false, follow: false },
};

/**
 * Admin area: /dashboard and nested routes.
 * Same-origin: JWT in cookies allows early redirect for guests and non-admin users.
 * Cross-origin API: cookies are not on this host — AdminRouteShell enforces role after profile loads.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers();
  const crossOrigin = isApiCrossOriginFromHost(headerStore.get('host'));

  if (!crossOrigin) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken || isTokenExpired(accessToken)) {
      redirect('/?auth=required&redirect=/dashboard');
    }

    const decoded = decodeToken(accessToken);
    if (!decoded) {
      redirect('/?auth=required&redirect=/dashboard');
    }
    // Legacy tokens без `role` пропускаем — клиентский AdminRouteShell сверит профиль.
    if (decoded.role != null && !hasDashboardAccess(decoded.role)) {
      redirect('/?forbidden=admin');
    }
  }

  return <AdminRouteShell>{children}</AdminRouteShell>;
}
