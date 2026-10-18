// Базовые типы, которые остались в shared
// Остальные типы перенесены в соответствующие entities и features

export interface ProductVariant {
  name: string;
  value: string;
  price?: number;
}

// Re-export для обратной совместимости
export type { User, Address } from '@/entities/user';
export type { Product } from '@/entities/product';
export type { CartItem, Cart } from '@/entities/cart';
export type { WishlistItem } from '@/entities/wishlist';
export type {
  Notification,
  NotificationType,
  NotificationListProps,
  NotificationItemProps,
} from '@/features/notifications';
