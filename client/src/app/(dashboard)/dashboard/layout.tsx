import { DashboardAccessGate } from '@/widgets/dashboard-admin/ui/DashboardAccessGate';
import type { ReactNode } from 'react';

export default function DashboardPagesLayout({ children }: { children: ReactNode }) {
  return <DashboardAccessGate>{children}</DashboardAccessGate>;
}
