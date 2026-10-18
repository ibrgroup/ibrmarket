import type { Order, OrderStatus } from '@/entities/order/model/types';
import { devLog } from '@/shared/lib/logger';
import { apiClient } from '../client';

const BASE = '/api/admin/orders';

interface AdminOrdersListResponse {
  data?: Order[];
  total?: number;
  page?: number;
  totalPages?: number;
  statusCounts?: Record<string, number>;
  success?: boolean;
  error?: boolean;
  message?: string;
}

export interface AdminOrdersFilter {
  status?: string;
  q?: string;
  paymentType?: string;
  userId?: string;
  /** ISO-строки дат */
  from?: string;
  to?: string;
}

function appendOrderFilterParams(params: URLSearchParams, filter: AdminOrdersFilter) {
  if (filter.status?.trim()) params.set('status', filter.status.trim().toUpperCase());
  if (filter.q?.trim()) params.set('q', filter.q.trim());
  if (filter.paymentType?.trim()) params.set('paymentType', filter.paymentType.trim());
  if (filter.userId?.trim()) params.set('userId', filter.userId.trim());
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
}

interface AdminOrderOneResponse {
  order?: Order;
  data?: Order;
  success?: boolean;
  error?: boolean;
}

function extractOrders(payload: unknown): Order[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload as Order[];
  if (typeof payload !== 'object') return [];
  const r = payload as AdminOrdersListResponse & { data?: unknown };
  if (Array.isArray(r.data)) return r.data as Order[];
  // Nest TransformInterceptor may wrap once more: { data: { data: Order[], total, ... } }
  if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
    const nested = r.data as AdminOrdersListResponse;
    if (Array.isArray(nested.data)) return nested.data;
  }
  return [];
}

function extractListMeta(payload: unknown): {
  total: number;
  totalPages: number;
  statusCounts: Record<string, number>;
  ordersFallback: number;
} {
  const empty = {
    total: 0,
    totalPages: 1,
    statusCounts: {} as Record<string, number>,
    ordersFallback: 0,
  };
  if (!payload || typeof payload !== 'object') return empty;
  const r = payload as AdminOrdersListResponse & { data?: unknown };
  const nested =
    r.data && typeof r.data === 'object' && !Array.isArray(r.data)
      ? (r.data as AdminOrdersListResponse)
      : null;
  const orders = extractOrders(payload);
  return {
    total: nested?.total ?? r.total ?? orders.length,
    totalPages: nested?.totalPages ?? r.totalPages ?? 1,
    statusCounts: nested?.statusCounts ?? r.statusCounts ?? {},
    ordersFallback: orders.length,
  };
}

function extractOrder(payload: unknown): Order | null {
  if (!payload || typeof payload !== 'object') return null;
  if ('_id' in payload && 'order_status' in payload) return payload as Order;
  const r = payload as AdminOrderOneResponse & { data?: unknown };
  if (r.order && typeof r.order === 'object' && '_id' in r.order) return r.order;
  if (r.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
    const nested = r.data as AdminOrderOneResponse & { _id?: string; order_status?: string };
    if (nested.order && typeof nested.order === 'object' && '_id' in nested.order) {
      return nested.order;
    }
    if ('_id' in nested && 'order_status' in nested) return nested as Order;
  }
  return null;
}

class AdminOrderService {
  async list(
    page = 1,
    limit = 20,
    filter: AdminOrdersFilter = {},
    sort = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<{
    orders: Order[];
    total: number;
    totalPages: number;
    statusCounts: Record<string, number>;
  }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    appendOrderFilterParams(params, filter);
    if (sort?.trim()) params.set('sort', sort.trim());
    params.set('order', order);
    const response = await apiClient.get<AdminOrdersListResponse>(`${BASE}?${params}`);
    const orders = extractOrders(response);
    const meta = extractListMeta(response);
    return {
      orders,
      total: meta.total,
      totalPages: meta.totalPages,
      statusCounts: meta.statusCounts,
    };
  }

  async getById(id: string): Promise<Order> {
    const response = await apiClient.get<AdminOrderOneResponse>(`${BASE}/${id}`);
    const order = extractOrder(response);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async updateStatus(orderId: string, order_status: OrderStatus): Promise<void> {
    await apiClient.patch(`${BASE}/${orderId}/status`, { order_status });
  }

  async deleteOrder(orderId: string): Promise<void> {
    await apiClient.delete(`${BASE}/${orderId}`);
  }

  async returnOrderItem(
    orderId: string,
    itemId: string,
    payload: { quantity: number; reason: 'RETURNED' | 'REFUSED' | 'CANCELLED'; note?: string },
  ): Promise<void> {
    await apiClient.patch(`${BASE}/${orderId}/items/${itemId}/return`, payload);
  }

  /** Triggers browser download (uses apiClient fetch path + blob). Учитывает текущие фильтры списка. */
  async downloadOrdersExport(max = 2000, filter: AdminOrdersFilter = {}): Promise<void> {
    try {
      const params = new URLSearchParams({ max: String(max) });
      appendOrderFilterParams(params, filter);
      const { downloadBlobFromApi } = await import('@/shared/lib/download-blob');
      await downloadBlobFromApi(`/api/admin/orders/export?${params}`, 'orders-export.csv');
    } catch (e) {
      devLog.error('[AdminOrderService] export failed', e);
      throw e;
    }
  }
}

export const adminOrderService = new AdminOrderService();
