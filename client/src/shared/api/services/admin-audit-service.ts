import { apiClient } from '../client';

export interface AdminAuditLogRow {
  _id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  actorUserId?: { name?: string; email?: string; role?: string } | string;
}

interface AuditListResponse {
  logs?: AdminAuditLogRow[];
  total?: number;
  page?: number;
  totalPages?: number;
  success?: boolean;
}

export interface AdminAuditFilter {
  /** Регекс по action на сервере */
  q?: string;
  /** Имя, email или ObjectId актора */
  actor?: string;
  entityType?: string;
  /** ISO-строки дат */
  from?: string;
  to?: string;
}

class AdminAuditService {
  async list(
    page = 1,
    limit = 50,
    filter: AdminAuditFilter = {},
    sort = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<{ logs: AdminAuditLogRow[]; total: number; totalPages: number }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filter.q?.trim()) params.set('q', filter.q.trim());
    if (filter.actor?.trim()) params.set('actor', filter.actor.trim());
    if (filter.entityType?.trim()) params.set('entityType', filter.entityType.trim());
    if (filter.from) params.set('from', filter.from);
    if (filter.to) params.set('to', filter.to);
    if (sort?.trim()) params.set('sort', sort.trim());
    params.set('order', order);
    const response = await apiClient.get<AuditListResponse>(`/api/admin/audit-logs?${params}`);
    const raw = (response.data ?? response) as AuditListResponse;
    return {
      logs: raw.logs ?? [],
      total: raw.total ?? 0,
      totalPages: raw.totalPages ?? 1,
    };
  }
}

export const adminAuditService = new AdminAuditService();
