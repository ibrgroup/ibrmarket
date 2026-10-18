'use client';

import { AdminAnalyticsSection, AdminDashboardMetrics } from '@/features/admin-data';
import { useAuth } from '@/features/auth';
import { ADMIN_PERM, canAccessAdminPermission } from '@/shared/lib/admin-permissions';
import { AdminOverviewSectionCards } from '@/widgets/dashboard-admin/ui/AdminOverviewSectionCards';
import { AdminPageHeader } from '@/widgets/dashboard-admin/ui/AdminPageHeader';

export function DashboardHomeView() {
  const { user } = useAuth();
  const canSeeFinance = canAccessAdminPermission(user?.role, ADMIN_PERM.FINANCE);

  return (
    <div className="space-y-6 md:space-y-8">
      <AdminPageHeader
        title="Обзор"
        description={
          canSeeFinance
            ? 'Ключевые показатели магазина и динамика продаж. Разделы — в меню слева или по Ctrl+K.'
            : 'Разделы панели — в меню слева или по Ctrl+K.'
        }
      />

      {canSeeFinance ? (
        <>
          <section aria-labelledby="admin-metrics-heading">
            <h2 id="admin-metrics-heading" className="sr-only">
              Ключевые показатели
            </h2>
            <AdminDashboardMetrics />
          </section>

          <section aria-labelledby="admin-analytics-heading">
            <h2 id="admin-analytics-heading" className="sr-only">
              Аналитика продаж
            </h2>
            <AdminAnalyticsSection />
          </section>
        </>
      ) : (
        <section aria-labelledby="admin-sections-heading">
          <h2 id="admin-sections-heading" className="sr-only">
            Разделы
          </h2>
          <AdminOverviewSectionCards />
        </section>
      )}
    </div>
  );
}
