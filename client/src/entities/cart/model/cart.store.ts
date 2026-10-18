import { useUserStore } from '@/entities/user';
import { cartService } from '@/shared/api/services/cart-service';
import { clearGuestId as clearGuestIdUtil, getOrCreateGuestId } from '@/shared/lib/guest-id';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCartItem } from '../lib/adapters';
import { cartLinesSameVariant } from '../lib/cart-variant-match';
import type { CartItem, CartState } from './types';

// Storage keys for guest and authenticated modes
const GUEST_CART_STORAGE_KEY = 'guest-cart-storage';
const AUTH_CART_STORAGE_KEY = 'cart-storage';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      totalPrice: 0,
      totalItems: 0,
      selectedItems: [],
      selectedTotalPrice: 0,
      selectedTotalItems: 0,
      isLoading: false,
      error: null,
      guestId: null,
      isSyncing: false, // Guard to prevent multiple simultaneous sync calls

      // Merge state (idempotent - only once per login)
      mergeStatus: 'idle' as const,
      mergeAttempts: 0,

      // Actions
      addItem: async (product: Omit<CartItem, '_id' | 'subTotal'>) => {
        console.log('CartStore: addItem called with product:', product);
        set({ isLoading: true, error: null });
        try {
          const existingItem = get().items.find((item: CartItem) =>
            cartLinesSameVariant(item, product),
          );

          console.log('CartStore: existingItem found:', existingItem);

          if (existingItem) {
            // Увеличиваем количество
            console.log('CartStore: increasing quantity for existing item');
            await get().setQuantity(existingItem._id, existingItem.quantity + product.quantity);
            set({ isLoading: false });
          } else {
            // Создаем временный ID для локального использования
            const tempId = Date.now().toString();
            // Убеждаемся, что isSelected явно установлен
            const tempItem = {
              ...createCartItem(product, tempId),
              isSelected: product.isSelected !== undefined ? product.isSelected : true,
            };
            console.log('CartStore: adding temporary item to local state:', tempItem);
            set((state: CartState) => ({
              items: [...state.items, tempItem],
              isLoading: false,
            }));
            get().calculateTotals();

            // Пытаемся добавить на сервер, если пользователь авторизован
            // Use user from Zustand store (more reliable than reading httpOnly cookie)
            const user = useUserStore.getState().user;
            console.log('CartStore: user from store:', user);

            if (user?._id) {
              try {
                console.log('CartStore: attempting to add to server...');
                const response = await cartService.addToCart(product);
                console.log('CartStore: server response:', response);

                if (response?.item) {
                  // Обновляем локальное состояние с серверным ID
                  // Сохраняем isSelected из исходного продукта или используем true по умолчанию
                  const newItem = {
                    ...createCartItem(product, response.item._id),
                    isSelected: product.isSelected !== undefined ? product.isSelected : true,
                  };
                  set((state: CartState) => ({
                    items: state.items.map((item) => (item._id === tempId ? newItem : item)),
                    isLoading: false,
                  }));
                  get().calculateTotals();
                  return;
                }
              } catch (serverError) {
                console.warn('Server cart unavailable, keeping local item:', serverError);
                // Оставляем локальный элемент, но отмечаем, что он не синхронизирован
                set({ isLoading: false });
                return;
              }
            } else {
              console.log('CartStore: user not authenticated, keeping local item');
              set({ isLoading: false });
              // Save guest cart to localStorage
              get().saveGuestCart();
            }
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : typeof error === 'string'
                ? error
                : 'Failed to add item';
          set({ error: message, isLoading: false });
          console.error('Cart add error:', error);
        }
      },

      removeItem: async (id: string) => {
        console.log('CartStore: removeItem called with id:', id);
        set({ isLoading: true, error: null });

        // Сначала удаляем из локального состояния для лучшего UX
        set((state: CartState) => ({
          items: state.items.filter((item) => item._id !== id),
          isLoading: false,
        }));
        get().calculateTotals();

        // Пытаемся удалить с сервера, если пользователь авторизован
        // Use user from Zustand store (more reliable than reading httpOnly cookie)
        const user = useUserStore.getState().user;
        console.log('CartStore: user from token:', user);

        if (user?._id) {
          const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
          if (!isValidObjectId) {
            console.log(
              'CartStore: skip server remove — локальная строка корзины (ещё не на сервере):',
              id,
            );
          } else {
            try {
              console.log('CartStore: attempting to remove from server...');
              await cartService.removeFromCart(id);
              console.log('CartStore: successfully removed from server');
            } catch (serverError) {
              console.warn('Server cart unavailable, item removed locally only:', serverError);
              // При ошибке сервера элемент уже удален локально, продолжаем без ошибки
            }
          }
        } else {
          console.log('CartStore: user not authenticated, removed from localStorage only');
          // Save guest cart after removal
          get().saveGuestCart();
        }
      },

      setQuantity: async (id: string, quantity: number) => {
        if (quantity < 1) {
          return get().removeItem(id);
        }

        set({ isLoading: true, error: null });
        try {
          const item = get().items.find((i: CartItem) => i._id === id);
          if (!item) throw new Error('Item not found');

          const subTotal = item.price * quantity;

          // Проверяем, является ли ID валидным MongoDB ObjectId
          // ObjectId в MongoDB имеет длину 24 символа и содержит только hex символы
          const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
          const isTempId = !isValidObjectId;

          // Сначала обновляем локальное состояние для лучшего UX
          set((state: CartState) => ({
            items: state.items.map((i) => (i._id === id ? { ...i, quantity, subTotal } : i)),
            isLoading: false,
          }));
          get().calculateTotals();

          // Если это временный ID (не ObjectId), просто обновляем локально
          if (isTempId) {
            console.log('CartStore: Temporary ID detected, updating locally only:', id);
            return;
          }

          // Пытаемся обновить на сервере, если пользователь авторизован
          // Use user from Zustand store (more reliable than reading httpOnly cookie)
          const user = useUserStore.getState().user;
          if (user?._id) {
            try {
              await cartService.updateQuantity(
                id,
                quantity,
                subTotal,
                item.size,
                item.weight,
                item.ram,
                item.color,
              );
            } catch (serverError) {
              console.warn('Server cart unavailable, quantity updated locally only:', serverError);
              // При ошибке сервера количество уже обновлено локально
            }
          } else {
            // Если пользователь не авторизован, просто обновляем локально
            console.log('CartStore: User not authenticated, updated locally only');
            // Save guest cart after quantity update
            get().saveGuestCart();
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update quantity';
          set({ error: message, isLoading: false });
          console.error('Cart quantity update error:', error);
        }
      },

      clearCart: async () => {
        set({ isLoading: true, error: null });
        try {
          // Пытаемся очистить на сервере, если пользователь авторизован
          // Use user from Zustand store (more reliable than reading httpOnly cookie)
          const user = useUserStore.getState().user;
          if (user?._id) {
            try {
              await cartService.emptyCart(user._id);
            } catch (serverError) {
              console.warn('Server cart unavailable, clearing localStorage:', serverError);
            }
          }

          // Очищаем локальное состояние
          set({ items: [], totalPrice: 0, totalItems: 0, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to clear cart';
          set({ error: message, isLoading: false });
          console.error('Cart clear error:', error);
          // При ошибке все равно очищаем локальную корзину
          set({ items: [], totalPrice: 0, totalItems: 0 });
        }
      },

      syncWithServer: async () => {
        const state = get();

        // GUARD: Prevent multiple simultaneous sync calls
        if (state.isSyncing) {
          console.log('CartStore: Sync already in progress, skipping');
          return;
        }

        console.log('CartStore: Starting sync with server...');
        set({ isLoading: true, error: null, isSyncing: true });
        try {
          // Use user from Zustand store (more reliable than reading httpOnly cookie)
          const user = useUserStore.getState().user;
          console.log('CartStore: User token:', user);

          if (!user || !user._id) {
            console.log('CartStore: No user ID, keeping local cart only');
            set({ isLoading: false });
            // Recalculate totals for unauthenticated users to ensure selectedItems
            // is properly calculated from rehydrated items with isSelected properties
            get().calculateTotals();
            return;
          }

          console.log('CartStore: Fetching cart from server...');
          const response = await cartService.getCart();
          console.log('CartStore: Server response:', response);

          // Получаем серверные данные
          const serverItems = response.items || (response as any).data || [];

          // При синхронизации приоритет у данных с сервера - они более актуальные
          // Убеждаемся, что все элементы имеют isSelected (по умолчанию true для восстановленных)
          const itemsWithSelection = serverItems.map((item: CartItem) => ({
            ...item,
            isSelected: item.isSelected !== undefined ? item.isSelected : true,
          }));

          set({
            items: itemsWithSelection,
            isLoading: false,
            isSyncing: false, // CRITICAL: Clear sync flag on success
          });
          get().calculateTotals();
          console.log(
            'CartStore: Sync completed successfully, loaded',
            serverItems.length,
            'items',
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to sync cart';
          set({ error: message, isLoading: false, isSyncing: false }); // CRITICAL: Clear sync flag on error
          console.error('CartStore: Sync error:', error);
          // При ошибке синхронизации оставляем локальную корзину
        }
      },

      calculateTotals: () => {
        const { items } = get();
        const totalPrice = items.reduce((sum: number, item: CartItem) => sum + item.subTotal, 0);
        const totalItems = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

        // Рассчитываем суммы для выбранных товаров
        const selectedItems = items.filter((item: CartItem) => item.isSelected);
        const selectedTotalPrice = selectedItems.reduce(
          (sum: number, item: CartItem) => sum + item.subTotal,
          0,
        );
        const selectedTotalItems = selectedItems.reduce(
          (sum: number, item: CartItem) => sum + item.quantity,
          0,
        );

        set({
          totalPrice,
          totalItems,
          selectedItems,
          selectedTotalPrice,
          selectedTotalItems,
        });
      },

      isInCart: (productId: string) => {
        return get().items.some((item: CartItem) => item.productId === productId);
      },

      // Новые действия для выбора товаров
      toggleItemSelection: (id: string) => {
        set((state: CartState) => ({
          items: state.items.map((item) =>
            item._id === id ? { ...item, isSelected: !item.isSelected } : item,
          ),
        }));
        get().calculateTotals();
      },

      selectAll: () => {
        set((state: CartState) => ({
          items: state.items.map((item) => ({ ...item, isSelected: true })),
        }));
        get().calculateTotals();
      },

      deselectAll: () => {
        set((state: CartState) => ({
          items: state.items.map((item) => ({ ...item, isSelected: false })),
        }));
        get().calculateTotals();
      },

      selectOnlyTheseItems: (ids: string[]) => {
        const idSet = new Set(ids.map(String));
        set((state: CartState) => ({
          items: state.items.map((item) => ({
            ...item,
            isSelected: idSet.has(item._id),
          })),
        }));
        get().calculateTotals();
      },

      selectOnlyItem: (id: string) => {
        get().selectOnlyTheseItems([id]);
      },

      removeSelectedItems: async () => {
        // Получаем ID выбранных товаров напрямую из items, а не из computed поля
        // Это гарантирует актуальность данных
        const { items } = get();
        const selectedIds = items.filter((item) => item.isSelected).map((item) => item._id);

        if (selectedIds.length === 0) {
          return;
        }

        // Удаляем все выбранные товары
        for (const id of selectedIds) {
          await get().removeItem(id);
        }
      },

      // ============================================================
      // GUEST MODE METHODS
      // ============================================================

      /**
       * Check if cart is in guest mode (not authenticated)
       * @returns true if user is not authenticated, false otherwise
       */
      isGuestMode: () => {
        const user = useUserStore.getState().user;
        return !user || !user._id;
      },

      /**
       * Load guest cart from localStorage
       * Called on logout and on page reload for unauthenticated users
       */
      loadGuestCart: () => {
        if (typeof window === 'undefined') return;

        try {
          const stored = localStorage.getItem(GUEST_CART_STORAGE_KEY);
          if (!stored) {
            // No guest cart - initialize empty with new guestId
            const guestId = getOrCreateGuestId();
            set({ items: [], guestId, totalPrice: 0, totalItems: 0 });
            get().calculateTotals();
            return;
          }

          const guestCart = JSON.parse(stored) as { items: CartItem[]; guestId: string };

          // Restore guest cart
          set({
            items: guestCart.items || [],
            guestId: guestCart.guestId || getOrCreateGuestId(),
          });
          get().calculateTotals();

          console.log('📦 [CartStore] Loaded guest cart:', guestCart.items.length, 'items');
        } catch (error) {
          console.error('❌ [CartStore] Failed to load guest cart:', error);
          // Initialize empty guest cart
          const guestId = getOrCreateGuestId();
          set({ items: [], guestId, totalPrice: 0, totalItems: 0 });
        }
      },

      /**
       * Save current cart as guest cart to localStorage
       * Called before logout and after cart modifications in guest mode
       */
      saveGuestCart: () => {
        if (typeof window === 'undefined') return;

        try {
          const { items, guestId: currentGuestId } = get();
          const guestId = currentGuestId || getOrCreateGuestId();

          const guestCart = {
            items,
            guestId,
            lastModified: Date.now(),
          };

          localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(guestCart));

          // Update guestId in store if it was created
          if (!currentGuestId) {
            set({ guestId });
          }

          console.log('💾 [CartStore] Saved guest cart:', items.length, 'items');
        } catch (error) {
          console.error('❌ [CartStore] Failed to save guest cart:', error);
        }
      },

      /**
       * Clear guest cart from localStorage
       * Called after successful merge on login
       */
      clearGuestCart: () => {
        if (typeof window === 'undefined') return;

        try {
          localStorage.removeItem(GUEST_CART_STORAGE_KEY);
          clearGuestIdUtil();
          set({ guestId: null });
          console.log('🗑️ [CartStore] Cleared guest cart');
        } catch (error) {
          console.error('❌ [CartStore] Failed to clear guest cart:', error);
        }
      },

      /**
       * Idempotent merge - executes only once per login session
       *
       * CRITICAL INVARIANTS:
       * - Maximum 1 attempt (mergeAttempts <= 1)
       * - If mergeStatus === 'done' → never execute again
       * - If mergeStatus === 'failed' → show toast, but don't retry automatically
       * - Guest cart cleared ONLY if mergeStatus === 'done'
       * - Independent from wishlist merge (no Promise.all)
       *
       * @returns Promise that resolves when merge is complete or skipped
       */
      tryMergeOnce: async () => {
        const state = get();

        // GUARD 1: Already done - never merge again
        if (state.mergeStatus === 'done') {
          console.log('📦 [CartStore] Merge already completed, skipping');
          return;
        }

        // GUARD 2: Already in progress - skip to prevent race conditions
        if (state.mergeStatus === 'in-progress') {
          console.warn('⚠️ [CartStore] Merge already in progress, skipping');
          return;
        }

        // GUARD 3: Maximum 1 attempt
        if (state.mergeAttempts >= 1) {
          console.warn('⚠️ [CartStore] Maximum merge attempts reached, skipping');
          return;
        }

        // GUARD 4: User must be authenticated
        const user = useUserStore.getState().user;
        if (!user) {
          console.log('📦 [CartStore] User not authenticated, skipping merge');
          return;
        }

        // GUARD 5: Check if guest cart exists
        const stored = localStorage.getItem(GUEST_CART_STORAGE_KEY);
        if (!stored) {
          console.log('📦 [CartStore] No guest cart to merge');
          set({ mergeStatus: 'done', mergeAttempts: 1 });
          return;
        }

        const guestCart = JSON.parse(stored) as { items: CartItem[]; guestId: string };

        if (!guestCart.items || guestCart.items.length === 0) {
          console.log('📦 [CartStore] Guest cart is empty, skipping merge');
          set({ mergeStatus: 'done', mergeAttempts: 1 });
          return;
        }

        // Start merge - set status to in-progress
        set({
          mergeStatus: 'in-progress',
          mergeAttempts: 1,
          isLoading: true,
        });

        console.log('🔄 [CartStore] Starting idempotent cart merge...');

        try {
          // Call backend merge endpoint
          const response = await cartService.mergeCart(guestCart.items);

          // Handle stock limit adjustments
          if (response.adjustedItems && response.adjustedItems.length > 0) {
            console.warn(
              '⚠️ [CartStore] Some items were adjusted due to stock limits:',
              response.adjustedItems,
            );

            // Show notification to user
            if (typeof window !== 'undefined') {
              try {
                const { toast } = await import('sonner');
                toast.warning('Некоторые товары были скорректированы из-за ограничений по складу', {
                  description: `${response.adjustedItems.length} товар(ов) было уменьшено в количестве`,
                });
              } catch (toastError) {
                // Non-critical - just log
                console.warn('[CartStore] Failed to show toast:', toastError);
              }
            }
          }

          // CRITICAL: Calculate totals BEFORE updating store
          // This ensures totalItems is updated in the same set() call
          const totalPrice = response.items.reduce(
            (sum: number, item: CartItem) => sum + item.subTotal,
            0,
          );
          const totalItems = response.items.reduce(
            (sum: number, item: CartItem) => sum + item.quantity,
            0,
          );
          const selectedItems = response.items.filter((item: CartItem) => item.isSelected);
          const selectedTotalPrice = selectedItems.reduce(
            (sum: number, item: CartItem) => sum + item.subTotal,
            0,
          );
          const selectedTotalItems = selectedItems.reduce(
            (sum: number, item: CartItem) => sum + item.quantity,
            0,
          );

          // Update store with merged cart (single atomic update)
          // CRITICAL: Update items AND totals in the same set() call to ensure UI updates
          set({
            items: response.items,
            totalPrice,
            totalItems, // CRITICAL: This triggers Header re-render
            selectedItems,
            selectedTotalPrice,
            selectedTotalItems,
            mergeStatus: 'done', // CRITICAL: Mark as done - never merge again
            isLoading: false,
            guestId: null, // Clear guestId after successful merge
          });

          // CRITICAL: Clear guest cart ONLY after successful merge
          get().clearGuestCart();

          // CRITICAL: Don't call syncWithServer() here - it will overwrite merged data
          // The merged data from backend is already the latest and correct
          // syncWithServer() is called separately by StoreSyncProvider or onRehydrateStorage
          // This ensures UI shows the correct merged cart immediately without overwriting

          // CRITICAL: Invalidate React Query cache to update UI
          // This ensures components using React Query will refetch and show updated cart
          if (typeof window !== 'undefined') {
            try {
              const { getQueryClient } = await import('@/shared/providers/query-provider');
              const queryClient = getQueryClient();
              if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['cart'] });
                console.log('🔄 [CartStore] Invalidated React Query cache for cart');
              } else {
                console.warn(
                  '[CartStore] React Query client not found, UI may not update immediately',
                );
              }
            } catch (error) {
              console.warn('[CartStore] Failed to invalidate React Query cache:', error);
            }
          }

          console.log('✅ [CartStore] Cart merge completed:', response.items.length, 'total items');
        } catch (error) {
          console.error('❌ [CartStore] Cart merge failed:', error);

          // CRITICAL: Mark as failed, but don't clear guest cart
          // Guest data remains in localStorage for user to retry manually
          set({
            mergeStatus: 'failed',
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to merge cart',
          });

          // Show toast notification (non-blocking)
          if (typeof window !== 'undefined') {
            try {
              // const { toast } = await import('sonner');
              // toast.error('Не удалось объединить корзину. Данные сохранены локально.', {
              //   description: 'Вы можете повторить попытку позже',
              //   duration: 8000,
              // });
            } catch (toastError) {
              // Non-critical - just log
              console.warn('[CartStore] Failed to show error toast:', toastError);
            }
          }

          // Don't throw - merge failure doesn't break login
        }
      },
    }),
    {
      name: AUTH_CART_STORAGE_KEY,
      partialize: (state: CartState) => {
        const user = useUserStore.getState().user;
        const isAuthenticated = !!user?._id;

        if (isAuthenticated) {
          // Authenticated mode: don't persist cart (server is source of truth)
          // Only persist minimal state for rehydration
          return {
            totalPrice: state.totalPrice,
            totalItems: state.totalItems,
          };
        } else {
          // Guest mode: persist full cart to separate storage
          // This is handled by saveGuestCart(), not by Zustand persist
          // Return empty to prevent persisting to default storage
          return {};
        }
      },
      // Simplified storage - guest mode uses separate keys via saveGuestCart/loadGuestCart
      // No custom storage needed - Zustand handles authenticated mode
    },
  ),
);
