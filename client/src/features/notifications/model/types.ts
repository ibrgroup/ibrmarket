/**
 * Типы уведомлений для IBR-MARKET
 */

export type NotificationType =
  | 'order'
  | 'product'
  | 'system'
  | 'promotional'
  | 'security'
  | 'payment'
  | 'delivery';

/**
 * Типы важных уведомлений, которые требуют звукового сигнала
 */
export type ImportantNotificationType = 'security' | 'payment' | 'delivery' | 'order';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  data?: Record<string, any>;
}

export interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClear?: (id: string) => void;
  onClearAll?: () => void;
  maxNotifications?: number;
  className?: string;
}

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onClear?: (id: string) => void;
}
