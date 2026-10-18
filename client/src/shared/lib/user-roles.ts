/**
 * Роли пользователя (согласовано с server/utils/roles.js и user.model).
 */
export const USER_ROLES = ['USER', 'ADMIN', 'MODERATOR', 'SUPPORT', 'MANAGER', 'SELLER'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const STAFF_ROLES: readonly UserRole[] = [
  'ADMIN',
  'MODERATOR',
  'SUPPORT',
  'MANAGER',
  'SELLER',
] as const;

export function isStaffRole(role: string | null | undefined): role is UserRole {
  if (!role) return false;
  return (STAFF_ROLES as readonly string[]).includes(String(role).toUpperCase());
}

/** Доступ к маршрутам /dashboard (панель персонала). */
export function hasDashboardAccess(role: string | null | undefined): boolean {
  return isStaffRole(role);
}

/** Полный администратор (назначение ролей, удаление пользователей и т.д.). */
export function isSuperAdminRole(role: string | null | undefined): boolean {
  return String(role || '').toUpperCase() === 'ADMIN';
}

export const ROLE_LABELS_RU: Record<UserRole, string> = {
  USER: 'Пользователь',
  ADMIN: 'Админ',
  MODERATOR: 'Модератор',
  SUPPORT: 'Поддержка',
  MANAGER: 'Менеджер',
  SELLER: 'Селлер',
};

export function roleLabelRu(role: string | null | undefined): string {
  if (!role) return 'Пользователь';
  const r = String(role).toUpperCase() as UserRole;
  return ROLE_LABELS_RU[r] ?? role;
}
