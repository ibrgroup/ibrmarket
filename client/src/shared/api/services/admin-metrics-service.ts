import { apiClient } from '../client';

export interface AdminMetrics {
  ordersTotal: number;
  ordersToday: number;
  usersTotal: number;
  productsTotal: number;
  revenuePaid: number;
}

export interface AdminPublicSettings {
  nodeEnv: string;
  frontendUrl: string | null;
  hasYooKassa: boolean;
  hasCloudinary: boolean;
}

export interface AdminAnalyticsRevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface AdminAnalyticsStatusCount {
  status: string;
  count: number;
}

export interface AdminAnalyticsTotals {
  revenue: number;
  paidOrders: number;
  averageOrderValue: number;
  newUsers: number;
}

export interface AdminAnalyticsTopProduct {
  productId: string;
  title: string;
  image?: string | null;
  quantity: number;
  revenue: number;
}

export interface AdminAnalyticsLowStockItem {
  productId: string;
  name: string;
  countInStock: number;
  price: number;
  image?: string | null;
}

export interface AdminAnalytics {
  period: { from: string; to: string };
  revenueByDay: AdminAnalyticsRevenuePoint[];
  statusBreakdown: AdminAnalyticsStatusCount[];
  totals: AdminAnalyticsTotals;
  previous: AdminAnalyticsTotals;
  topProducts: AdminAnalyticsTopProduct[];
  lowStock: AdminAnalyticsLowStockItem[];
}

interface AnalyticsResponse {
  analytics?: AdminAnalytics;
  success?: boolean;
  error?: boolean;
}

export interface AdminBadges {
  /** Заказы в статусах WAITING_PAYMENT и PAID */
  activeOrders: number;
  openConversations: number;
}

interface BadgesResponse {
  badges?: AdminBadges;
  success?: boolean;
  error?: boolean;
}

interface MetricsResponse {
  metrics?: AdminMetrics;
  success?: boolean;
  error?: boolean;
}

interface SettingsResponse {
  settings?: AdminPublicSettings;
  success?: boolean;
  error?: boolean;
}

class AdminMetricsService {
  async getMetrics(): Promise<AdminMetrics> {
    const response = await apiClient.get<MetricsResponse>('/api/admin/metrics');
    const raw = (response.data ?? response) as MetricsResponse;
    if (!raw.metrics) {
      throw new Error('Metrics unavailable');
    }
    return raw.metrics;
  }

  async getAnalytics(days: number): Promise<AdminAnalytics> {
    const response = await apiClient.get<AnalyticsResponse>(
      `/api/admin/analytics?days=${encodeURIComponent(days)}`,
    );
    const raw = (response.data ?? response) as AnalyticsResponse;
    if (!raw.analytics) {
      throw new Error('Analytics unavailable');
    }
    return raw.analytics;
  }

  async getBadges(): Promise<AdminBadges> {
    const response = await apiClient.get<BadgesResponse>('/api/admin/badges');
    const raw = (response.data ?? response) as BadgesResponse;
    if (!raw.badges) {
      throw new Error('Badges unavailable');
    }
    return raw.badges;
  }

  async getSettings(): Promise<AdminPublicSettings> {
    const response = await apiClient.get<SettingsResponse>('/api/admin/settings');
    const raw = (response.data ?? response) as SettingsResponse;
    if (!raw.settings) {
      throw new Error('Settings unavailable');
    }
    return raw.settings;
  }
}

export const adminMetricsService = new AdminMetricsService();
