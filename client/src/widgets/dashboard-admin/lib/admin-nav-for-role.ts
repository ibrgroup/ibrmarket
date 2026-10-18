import { canAccessAdminSegment } from '@/shared/lib/admin-permissions';

import { ADMIN_NAV, type AdminNavItem } from '../config/nav';

export function getAdminNavForRole(role: string | undefined | null): AdminNavItem[] {
  return ADMIN_NAV.filter((item) => canAccessAdminSegment(role, item.segment));
}
