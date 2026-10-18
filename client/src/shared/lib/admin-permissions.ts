/**
 * Права панели /dashboard (зеркало server/utils/permissions.js).
 *
 * ADMIN — всё. MANAGER — каталог, контент, заказы, чаты, финансы (без настроек и аудита).
 * SUPPORT — заказы и чаты. MODERATOR — каталог и контент. SELLER — только каталог.
 */
import { isStaffRole, isSuperAdminRole } from '@/shared/lib/user-roles';

export const ADMIN_PERM = {
  CATALOG: 'catalog',
  CONTENT: 'content',
  ORDERS: 'orders',
  USERS: 'users',
  AUDIT: 'audit',
  SETTINGS: 'settings',
  INBOX: 'inbox',
  FINANCE: 'finance',
  /** Смена статуса и частичный возврат позиций (не удаление заказа). */
  FULFILLMENT: 'fulfillment',
} as const;

export type AdminPermission = (typeof ADMIN_PERM)[keyof typeof ADMIN_PERM];

export type AdminDashboardSegment =
  | 'overview'
  | 'catalog'
  | 'orders'
  | 'users'
  | 'support'
  | 'audit'
  | 'settings';

const ALL_PERMS: AdminPermission[] = Object.values(ADMIN_PERM);

const MATRIX: Record<string, AdminPermission[]> = {
  MODERATOR: [ADMIN_PERM.CATALOG, ADMIN_PERM.CONTENT],
  SUPPORT: [ADMIN_PERM.ORDERS, ADMIN_PERM.INBOX],
  MANAGER: [
    ADMIN_PERM.CATALOG,
    ADMIN_PERM.CONTENT,
    ADMIN_PERM.ORDERS,
    ADMIN_PERM.INBOX,
    ADMIN_PERM.FINANCE,
    ADMIN_PERM.FULFILLMENT,
  ],
  SELLER: [ADMIN_PERM.CATALOG],
};

function rolePermissions(role: string | null | undefined): AdminPermission[] {
  const r = String(role || '').toUpperCase();
  if (isSuperAdminRole(r)) return ALL_PERMS;
  return MATRIX[r] ?? [];
}

export function canAccessAdminPermission(
  role: string | null | undefined,
  permission: AdminPermission,
): boolean {
  if (!isStaffRole(role)) return false;
  if (isSuperAdminRole(role)) return true;
  return rolePermissions(role).includes(permission);
}

const SEGMENT_PERM: Record<Exclude<AdminDashboardSegment, 'overview'>, AdminPermission> = {
  catalog: ADMIN_PERM.CATALOG,
  orders: ADMIN_PERM.ORDERS,
  users: ADMIN_PERM.USERS,
  support: ADMIN_PERM.INBOX,
  audit: ADMIN_PERM.AUDIT,
  settings: ADMIN_PERM.SETTINGS,
};

export function canAccessAdminSegment(
  role: string | null | undefined,
  segment: AdminDashboardSegment,
): boolean {
  if (segment === 'overview') return isStaffRole(role);
  const perm = SEGMENT_PERM[segment];
  return canAccessAdminPermission(role, perm);
}

export function pathnameToAdminSegment(pathname: string): AdminDashboardSegment | null {
  const p = pathname.replace(/\/$/, '') || '/';
  if (p === '/dashboard') return 'overview';
  if (p.startsWith('/dashboard/catalog')) return 'catalog';
  if (p.startsWith('/dashboard/orders')) return 'orders';
  if (p.startsWith('/dashboard/users')) return 'users';
  if (p.startsWith('/dashboard/owner-messages')) return 'support';
  if (p.startsWith('/dashboard/audit')) return 'audit';
  if (p.startsWith('/dashboard/settings')) return 'settings';
  return null;
}

/** Доступ к конкретному URL админки; неизвестные пути — только админ. */
export function canAccessAdminPath(role: string | null | undefined, pathname: string): boolean {
  if (!isStaffRole(role)) return false;
  const segment = pathnameToAdminSegment(pathname);
  if (segment == null) return isSuperAdminRole(role);
  return canAccessAdminSegment(role, segment);
}
