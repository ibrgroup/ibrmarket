import type { UserRole } from '@/shared/lib/user-roles';
import { apiClient } from '../client';

export interface AdminUserRow {
  _id: string;
  name: string;
  email?: string | null;
  mobile?: string | null;
  role: UserRole;
  status?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AdminUsersResponse {
  users?: AdminUserRow[];
  total?: number;
  page?: number;
  totalPages?: number;
  success?: boolean;
  error?: boolean;
}

export type AdminUserStatus = 'Active' | 'Inactive' | 'Suspended';

class AdminUsersService {
  async updateRole(userId: string, role: UserRole): Promise<void> {
    await apiClient.patch(`/api/admin/users/${userId}/role`, { role });
  }

  async updateStatus(userId: string, status: AdminUserStatus): Promise<void> {
    await apiClient.patch(`/api/admin/users/${userId}/status`, { status });
  }

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/api/admin/users/${userId}`);
  }

  async list(
    page = 1,
    limit = 20,
    q?: string,
    sort = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<{ users: AdminUserRow[]; total: number; totalPages: number }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q?.trim()) params.set('q', q.trim());
    if (sort?.trim()) params.set('sort', sort.trim());
    params.set('order', order);
    const response = await apiClient.get<AdminUsersResponse>(`/api/admin/users?${params}`);
    const raw = (response.data ?? response) as AdminUsersResponse;
    return {
      users: raw.users ?? [],
      total: raw.total ?? 0,
      totalPages: raw.totalPages ?? 1,
    };
  }
}

export const adminUsersService = new AdminUsersService();
