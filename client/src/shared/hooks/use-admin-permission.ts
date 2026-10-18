'use client';

import { useAuth } from '@/features/auth';
import {
  ADMIN_PERM,
  type AdminPermission,
  canAccessAdminPermission,
} from '@/shared/lib/admin-permissions';
import { isSuperAdminRole } from '@/shared/lib/user-roles';

export function useAdminPermission(permission: AdminPermission): boolean {
  const { user } = useAuth();
  return canAccessAdminPermission(user?.role, permission);
}

export function useIsSuperAdmin(): boolean {
  const { user } = useAuth();
  return isSuperAdminRole(user?.role);
}

export { ADMIN_PERM };
