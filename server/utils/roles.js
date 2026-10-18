/**
 * Роли пользователя маркетплейса (синхронизировать с user.model enum и клиентом).
 */
export const ROLES = {
	USER: 'USER',
	ADMIN: 'ADMIN',
	MODERATOR: 'MODERATOR',
	SUPPORT: 'SUPPORT',
	MANAGER: 'MANAGER',
	SELLER: 'SELLER',
};

/** Все значения, допустимые в поле user.role */
export const ALL_USER_ROLES = Object.values(ROLES);

/**
 * Доступ к панели /dashboard и к общим admin API (кроме явно «только ADMIN» маршрутов).
 */
export const STAFF_ROLES = [
	ROLES.ADMIN,
	ROLES.MODERATOR,
	ROLES.SUPPORT,
	ROLES.MANAGER,
	ROLES.SELLER,
];

export function isStaffRole(role) {
	if (role == null) return false;
	return STAFF_ROLES.includes(String(role).toUpperCase());
}

/** Полный контроль (назначение ролей, удаление пользователей, опасные операции). */
export function isSuperAdminRole(role) {
	return String(role || '').toUpperCase() === ROLES.ADMIN;
}

/**
 * Клейм role в access JWT: пробрасываем реальную роль из БД, иначе USER.
 * Неизвестные значения (например, устаревшие) → USER.
 */
export function accessTokenRoleFromDb(dbRole) {
	const r = String(dbRole || ROLES.USER).toUpperCase();
	if (ALL_USER_ROLES.includes(r)) return r;
	return ROLES.USER;
}

/** Сообщения от сотрудника магазина (не покупатель). */
export function isStaffSenderRole(role) {
	return isStaffRole(role);
}
