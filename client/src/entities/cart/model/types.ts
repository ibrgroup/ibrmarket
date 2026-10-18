/**
 * Типы для сущности Cart (корзина)
 */

/**
 * Элемент корзины (синхронизировано с server/models/cart.model.js)
 * ❗ countInStock НЕ хранится в корзине — остатки проверяются только при создании заказа
 */
export interface CartItem {
  _id: string;
  productId: string;
  productTitle: string; // Название товара
  name?: string; // Алиас для productTitle (обратная совместимость)
  price: number;
  quantity: number;
  subTotal: number;
  isSelected?: boolean; // Выбран ли товар для оформления заказа (default: true)
  image?: string;
  size?: string;
  color?: string;
  weight?: string;
  ram?: string;
  brand?: string;
  oldPrice?: number;
  discount?: number;
  rating?: number;
  // Legacy field - ignored, kept for backward compatibility with frontend code that passes it
  countInStock?: number;
}

// Вся корзина
export interface Cart {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}

// Guest cart data stored in localStorage
export interface GuestCart {
  items: CartItem[];
  guestId: string;
  lastModified: number; // timestamp
}

// Состояние корзины для store
export interface CartState {
  // State
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
  selectedItems: CartItem[]; // Только выбранные товары
  selectedTotalPrice: number; // Сумма выбранных товаров
  selectedTotalItems: number; // Количество выбранных товаров
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean; // Guard to prevent multiple simultaneous sync calls

  // Actions
  addItem: (product: Omit<CartItem, '_id' | 'subTotal'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  setQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  syncWithServer: () => Promise<void>;
  calculateTotals: () => void;
  isInCart: (productId: string) => boolean;

  // Новые действия для выбора товаров
  toggleItemSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  /** Только эта позиция отмечена для оформления (остальные снимаются). Для «Купить сейчас». */
  selectOnlyItem: (id: string) => void;
  /** Отмечены только перечисленные позиции (остальные isSelected: false). */
  selectOnlyTheseItems: (ids: string[]) => void;
  removeSelectedItems: () => Promise<void>; // Удалить только выбранные товары

  // Guest mode fields and methods
  guestId: string | null;
  isGuestMode: () => boolean;
  loadGuestCart: () => void;
  saveGuestCart: () => void;
  clearGuestCart: () => void;

  // Merge state (idempotent merge - only once per login)
  mergeStatus: 'idle' | 'in-progress' | 'done' | 'failed';
  mergeAttempts: number; // Maximum 1 attempt

  // CRITICAL: Idempotent merge - executes only once, never retries automatically
  // Call only when mergeStatus === 'idle' and user is authenticated
  tryMergeOnce: () => Promise<void>;
}
