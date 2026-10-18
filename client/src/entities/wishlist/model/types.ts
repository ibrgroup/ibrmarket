/**
 * Типы для сущности Wishlist (избранное)
 */

import { Product } from '@/entities';

// Элемент избранного
export interface WishlistItem {
  _id: string;
  productId: string;
  name: string; // Для обратной совместимости
  productTitle?: string; // Основное поле, которое использует бэкенд
  price: number;
  image?: string;
  brand?: string;
  oldPrice?: number;
  discount?: number;
  rating?: number;
  [key: string]: any; // для дополнительных полей
}

// Состояние избранного для store
export interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean; // Guard to prevent multiple simultaneous sync calls

  addItem: (product: Omit<WishlistItem, '_id'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  removeItemByProductId: (productId: string) => Promise<void>;
  toggleItem: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  syncWithServer: () => Promise<void>;
  clearWishlist: () => void;

  // Guest mode fields and methods
  guestId: string | null;
  isGuestMode: () => boolean;
  loadGuestWishlist: () => void;
  saveGuestWishlist: () => void;
  clearGuestWishlist: () => void;

  // Merge state (idempotent merge - only once per login)
  mergeStatus: 'idle' | 'in-progress' | 'done' | 'failed';
  mergeAttempts: number; // Maximum 1 attempt

  // CRITICAL: Idempotent merge - executes only once, never retries automatically
  // Call only when mergeStatus === 'idle' and user is authenticated
  tryMergeOnce: () => Promise<void>;
}

// Guest wishlist data stored in localStorage
export interface GuestWishlist {
  items: WishlistItem[];
  guestId: string;
  lastModified: number; // timestamp
}
