import { ROLES, isStaffRole, isSuperAdminRole } from './roles.js';

/**
 * Гранулярные права для API и панели (не путать с user.role).
 *
 * ADMIN — всё. MANAGER — каталог, контент, заказы, чаты, финансы (без настроек/аудита).
 * SUPPORT — заказы и чаты (без CSV/выручки). MODERATOR — каталог и контент.
 * SELLER — только каталог (без удаления).
 */
export const PERM = {
	CATALOG: 'catalog',
	CONTENT: 'content',
	ORDERS: 'orders',
	USERS: 'users',
	AUDIT: 'audit',
	SETTINGS: 'settings',
	INBOX: 'inbox',
	FINANCE: 'finance',
	/** Смена статуса заказа и частичный возврат позиций (не удаление заказа). */
	FULFILLMENT: 'fulfillment',
};

const ALL_PERMS = Object.values(PERM);

/** Права по ролям (ADMIN — всё через isSuperAdminRole). */
const MATRIX = {
	[ROLES.MODERATOR]: [PERM.CATALOG, PERM.CONTENT],
	[ROLES.SUPPORT]: [PERM.ORDERS, PERM.INBOX],
	[ROLES.MANAGER]: [
		PERM.CATALOG,
		PERM.CONTENT,
		PERM.ORDERS,
		PERM.INBOX,
		PERM.FINANCE,
		PERM.FULFILLMENT,
	],
	[ROLES.SELLER]: [PERM.CATALOG],
};

export function rolePermissions(role) {
	const r = String(role || '').toUpperCase();
	if (isSuperAdminRole(r)) return ALL_PERMS;
	return MATRIX[r] || [];
}

/** Сотрудник с конкретным правом (ADMIN — любое). */
export function can(role, permission) {
	if (!isStaffRole(role)) return false;
	if (isSuperAdminRole(role)) return true;
	return rolePermissions(role).includes(permission);
}

export function canAny(role, permissions) {
	return (permissions || []).some((p) => can(role, p));
}
