import type { Product } from '@/entities/product';
import { useUserStore } from '@/entities/user';
import { wishlistService } from '@/shared/api/services/wishlist-service';
import { getOrCreateGuestId } from '@/shared/lib/guest-id';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createWishlistItem, productToWishlistItem } from '../lib/adapters';
import type { WishlistItem, WishlistState } from './types';

// Storage keys for guest and authenticated modes
const GUEST_WISHLIST_STORAGE_KEY = 'guest-wishlist-storage';
const AUTH_WISHLIST_STORAGE_KEY = 'wishlist-storage';

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,
      guestId: null,
      isSyncing: false, // Guard to prevent multiple simultaneous sync calls

      // Merge state (idempotent - only once per login)
      mergeStatus: 'idle' as const,
      mergeAttempts: 0,

      addItem: async (product: Omit<WishlistItem, '_id'>) => {
        console.log('WishlistStore: addItem called with product:', product);
        set({ isLoading: true, error: null });
        try {
          // Проверяем, есть ли товар в избранном
          const existingItem = get().items.find(
            (item: WishlistItem) => item.productId === product.productId,
          );
          console.log('WishlistStore: existingItem found:', existingItem);

          if (existingItem) {
            console.log('WishlistStore: item already in wishlist, skipping');
            set({ isLoading: false });
            return;
          }

          // Создаем временный ID для локального использования
          const tempId = Date.now().toString();
          const tempItem = createWishlistItem(product, tempId);
          console.log('WishlistStore: adding temporary item to local state:', tempItem);
          set((state: WishlistState) => ({
            items: [...state.items, tempItem],
            isLoading: false,
          }));

          // Пытаемся добавить на сервер, если пользователь авторизован
          // Use user from Zustand store (more reliable than reading httpOnly cookie)
          const user = useUserStore.getState().user;
          console.log('WishlistStore: user from store:', user);

          if (user?._id) {
            try {
              console.log('WishlistStore: attempting to add to server...', product);
              await wishlistService.addToWishlist(product);
              console.log('WishlistStore: successfully added to server');

              // Бэкенд не возвращает данные при добавлении, синхронизируемся для получения актуальных данных
              // Временно оставляем локальный элемент с tempId, синхронизация обновит его с серверным ID
              set({ isLoading: false });

              // Синхронизируемся асинхронно для получения серверного _id
              // Используем requestAnimationFrame для более плавного обновления UI
              requestAnimationFrame(() => {
                get()
                  .syncWithServer()
                  .catch((error) => {
                    console.warn('Failed to sync wishlist after add:', error);
                  });
              });
              return;
            } catch (serverError) {
              console.error('Server wishlist error:', serverError);
              const errorMessage =
                serverError instanceof Error
                  ? serverError.message
                  : 'Ошибка при добавлении в избранное на сервере';

              // Удаляем локальный элемент, если сервер вернул ошибку
              set((state: WishlistState) => ({
                items: state.items.filter((item) => item._id !== tempId),
                isLoading: false,
                error: errorMessage,
              }));

              // Пробрасываем ошибку дальше, чтобы пользователь увидел сообщение
              throw serverError;
            }
          } else {
            console.log('WishlistStore: user not authenticated, keeping local item');
            set({ isLoading: false });
            // Save guest wishlist to localStorage
            get().saveGuestWishlist();
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to add to wishlist';
          set({ error: message, isLoading: false });
          console.error('Wishlist add error:', error);
        }
      },

      removeItem: async (id: string) => {
        console.log('WishlistStore: removeItem called with id:', id);
        set({ isLoading: true, error: null });

        // Проверяем, является ли ID валидным MongoDB ObjectId
        // ObjectId в MongoDB имеет длину 24 символа и содержит только hex символы
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        const isTempId = !isValidObjectId;

        // Сначала удаляем из локального состояния для лучшего UX
        set((state: WishlistState) => ({
          items: state.items.filter((item) => item._id !== id),
          isLoading: false,
        }));

        // Если это временный ID (не ObjectId), просто удаляем локально
        if (isTempId) {
          console.log('WishlistStore: Temporary ID detected, removing locally only:', id);
          return;
        }

        // Пытаемся удалить с сервера, если пользователь авторизован
        // Use user from Zustand store (more reliable than reading httpOnly cookie)
        const user = useUserStore.getState().user;
        console.log('WishlistStore: user from store:', user);

        if (user?._id) {
          try {
            console.log('WishlistStore: attempting to remove from server...');
            await wishlistService.removeFromWishlist(id);
            console.log('WishlistStore: successfully removed from server');
          } catch (serverError) {
            console.warn('Server wishlist unavailable, item removed locally only:', serverError);
            // При ошибке сервера элемент уже удален локально, продолжаем без ошибки
          }
        } else {
          console.log('WishlistStore: user not authenticated, removed from localStorage only');
          // Save guest wishlist after removal
          get().saveGuestWishlist();
        }
      },

      isInWishlist: (productId: string) => {
        return get().items.some((item: WishlistItem) => item.productId === productId);
      },

      removeItemByProductId: async (productId: string) => {
        console.log('WishlistStore: removeItemByProductId called with productId:', productId);
        const item = get().items.find((item: WishlistItem) => item.productId === productId);
        if (item) {
          await get().removeItem(item._id);
        } else {
          console.warn('WishlistStore: Item not found for productId:', productId);
        }
      },

      toggleItem: async (product: Product | any) => {
        console.log('WishlistStore: toggleItem called with product:', product);
        const productId = product._id || product.productId;
        if (!productId) {
          throw new Error('Не удалось определить ID товара');
        }

        const isInWishlist = get().isInWishlist(productId);

        try {
          if (isInWishlist) {
            await get().removeItemByProductId(productId);
          } else {
            // Используем адаптер для правильного преобразования Product в WishlistItem
            const wishlistItem = productToWishlistItem(product as Product);
            await get().addItem(wishlistItem);
          }
        } catch (error) {
          console.error('WishlistStore: toggleItem error:', error);
          throw error;
        }
      },

      syncWithServer: async () => {
        const state = get();

        // GUARD: Prevent multiple simultaneous sync calls
        if (state.isSyncing) {
          console.log('WishlistStore: Sync already in progress, skipping');
          return;
        }

        console.log('WishlistStore: Starting sync with server...');
        set({ isLoading: true, error: null, isSyncing: true });
        try {
          // Use user from Zustand store (more reliable than reading httpOnly cookie)
          const user = useUserStore.getState().user;
          console.log('WishlistStore: User from store:', user);

          if (!user || !user._id) {
            console.log('WishlistStore: No user ID, keeping local wishlist only');
            set({ isLoading: false });
            return;
          }

          console.log('WishlistStore: Fetching wishlist from server...');
          const response = await wishlistService.getWishlist();
          console.log('WishlistStore: Server response:', response);

          // Получаем серверные данные
          const serverItems = response.items || (response as any).data || [];

          // Маппим серверные данные в формат WishlistItem (productTitle -> name)
          const mappedItems = serverItems.map((item: any) => ({
            ...item,
            name: item.productTitle || item.name || '',
            productTitle: item.productTitle || item.name || '',
          }));

          // При синхронизации приоритет у данных с сервера - они более актуальные
          set({ items: mappedItems, isLoading: false, isSyncing: false }); // CRITICAL: Clear sync flag on success
          console.log(
            'WishlistStore: Sync completed successfully, loaded',
            mappedItems.length,
            'items',
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to sync wishlist';
          set({ error: message, isLoading: false, isSyncing: false }); // CRITICAL: Clear sync flag on error
          console.error('WishlistStore: Sync error:', error);
          // При ошибке синхронизации оставляем локальное избранное
        }
      },

      clearWishlist: () => {
        set({ items: [], error: null });
      },

      // ============================================================
      // GUEST MODE METHODS
      // ============================================================

      /**
       * Check if wishlist is in guest mode (not authenticated)
       * @returns true if user is not authenticated, false otherwise
       */
      isGuestMode: () => {
        const user = useUserStore.getState().user;
        return !user || !user._id;
      },

      /**
       * Load guest wishlist from localStorage
       * Called on logout and on page reload for unauthenticated users
       */
      loadGuestWishlist: () => {
        if (typeof window === 'undefined') return;

        try {
          const stored = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
          if (!stored) {
            // No guest wishlist - initialize empty with new guestId
            const guestId = getOrCreateGuestId();
            set({ items: [], guestId });
            return;
          }

          const guestWishlist = JSON.parse(stored) as { items: WishlistItem[]; guestId: string };

          // Restore guest wishlist
          set({
            items: guestWishlist.items || [],
            guestId: guestWishlist.guestId || getOrCreateGuestId(),
          });

          console.log(
            '📦 [WishlistStore] Loaded guest wishlist:',
            guestWishlist.items.length,
            'items',
          );
        } catch (error) {
          console.error('❌ [WishlistStore] Failed to load guest wishlist:', error);
          // Initialize empty guest wishlist
          const guestId = getOrCreateGuestId();
          set({ items: [], guestId });
        }
      },

      /**
       * Save current wishlist as guest wishlist to localStorage
       * Called before logout and after wishlist modifications in guest mode
       */
      saveGuestWishlist: () => {
        if (typeof window === 'undefined') return;

        try {
          const { items, guestId: currentGuestId } = get();
          const guestId = currentGuestId || getOrCreateGuestId();

          const guestWishlist = {
            items,
            guestId,
            lastModified: Date.now(),
          };

          localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(guestWishlist));

          // Update guestId in store if it was created
          if (!currentGuestId) {
            set({ guestId });
          }

          console.log('💾 [WishlistStore] Saved guest wishlist:', items.length, 'items');
        } catch (error) {
          console.error('❌ [WishlistStore] Failed to save guest wishlist:', error);
        }
      },

      /**
       * Clear guest wishlist from localStorage
       * Called after successful merge on login
       */
      clearGuestWishlist: () => {
        if (typeof window === 'undefined') return;

        try {
          localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);
          set({ guestId: null });
          console.log('🗑️ [WishlistStore] Cleared guest wishlist');
        } catch (error) {
          console.error('❌ [WishlistStore] Failed to clear guest wishlist:', error);
        }
      },

      /**
       * Idempotent merge - executes only once per login session
       *
       * CRITICAL INVARIANTS:
       * - Maximum 1 attempt (mergeAttempts <= 1)
       * - If mergeStatus === 'done' → never execute again
       * - If mergeStatus === 'failed' → show toast, but don't retry automatically
       * - Guest wishlist cleared ONLY if mergeStatus === 'done'
       * - Independent from cart merge (no Promise.all)
       *
       * @returns Promise that resolves when merge is complete or skipped
       */
      tryMergeOnce: async () => {
        const state = get();

        // GUARD 1: Already done - never merge again
        if (state.mergeStatus === 'done') {
          console.log('📦 [WishlistStore] Merge already completed, skipping');
          return;
        }

        // GUARD 2: Already in progress - skip to prevent race conditions
        if (state.mergeStatus === 'in-progress') {
          console.warn('⚠️ [WishlistStore] Merge already in progress, skipping');
          return;
        }

        // GUARD 3: Maximum 1 attempt
        if (state.mergeAttempts >= 1) {
          console.warn('⚠️ [WishlistStore] Maximum merge attempts reached, skipping');
          return;
        }

        // GUARD 4: User must be authenticated
        const user = useUserStore.getState().user;
        if (!user) {
          console.log('📦 [WishlistStore] User not authenticated, skipping merge');
          return;
        }

        // GUARD 5: Check if guest wishlist exists
        const stored = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY);
        if (!stored) {
          console.log('📦 [WishlistStore] No guest wishlist to merge');
          set({ mergeStatus: 'done', mergeAttempts: 1 });
          return;
        }

        const guestWishlist = JSON.parse(stored) as { items: WishlistItem[]; guestId: string };

        if (!guestWishlist.items || guestWishlist.items.length === 0) {
          console.log('📦 [WishlistStore] Guest wishlist is empty, skipping merge');
          set({ mergeStatus: 'done', mergeAttempts: 1 });
          return;
        }

        // Start merge - set status to in-progress
        set({
          mergeStatus: 'in-progress',
          mergeAttempts: 1,
          isLoading: true,
        });

        console.log('🔄 [WishlistStore] Starting idempotent wishlist merge...');

        try {
          // Call backend merge endpoint
          const response = await wishlistService.mergeWishlist(guestWishlist.items);

          // Update store with merged wishlist (single atomic update)
          // CRITICAL: Update items in single set() call to ensure UI updates immediately
          set({
            items: response.items, // CRITICAL: This triggers Header re-render via items.length selector
            mergeStatus: 'done', // CRITICAL: Mark as done - never merge again
            isLoading: false,
            guestId: null, // Clear guestId after successful merge
          });

          // CRITICAL: Clear guest wishlist ONLY after successful merge
          get().clearGuestWishlist();

          // CRITICAL: Don't call syncWithServer() here - it will overwrite merged data
          // The merged data from backend is already the latest and correct
          // syncWithServer() is called separately by StoreSyncProvider or onRehydrateStorage
          // This ensures UI shows the correct merged wishlist immediately without overwriting

          // CRITICAL: Invalidate React Query cache to update UI
          // This ensures components using React Query will refetch and show updated wishlist
          if (typeof window !== 'undefined') {
            try {
              const { getQueryClient } = await import('@/shared/providers/query-provider');
              const queryClient = getQueryClient();
              if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['wishlist'] });
                console.log('🔄 [WishlistStore] Invalidated React Query cache for wishlist');
              } else {
                console.warn(
                  '[WishlistStore] React Query client not found, UI may not update immediately',
                );
              }
            } catch (error) {
              console.warn('[WishlistStore] Failed to invalidate React Query cache:', error);
            }
          }

          console.log(
            '✅ [WishlistStore] Wishlist merge completed:',
            response.items.length,
            'total items',
          );
        } catch (error) {
          console.error('❌ [WishlistStore] Wishlist merge failed:', error);

          // CRITICAL: Mark as failed, but don't clear guest wishlist
          // Guest data remains in localStorage for user to retry manually
          set({
            mergeStatus: 'failed',
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to merge wishlist',
          });

          // Show toast notification (non-blocking)
          if (typeof window !== 'undefined') {
            try {
              // const { toast } = await import('sonner');
              // toast.error('Не удалось объединить избранное. Данные сохранены локально.', {
              //   description: 'Вы можете повторить попытку позже',
              //   duration: 8000,
              // });
            } catch (toastError) {
              // Non-critical - just log
              console.warn('[WishlistStore] Failed to show error toast:', toastError);
            }
          }

          // Don't throw - merge failure doesn't break login
        }
      },
    }),
    {
      name: AUTH_WISHLIST_STORAGE_KEY,
      partialize: (_state: WishlistState) => {
        const user = useUserStore.getState().user;
        const isAuthenticated = !!user?._id;

        if (isAuthenticated) {
          // Authenticated mode: don't persist wishlist (server is source of truth)
          return {};
        } else {
          // Guest mode: persist handled by saveGuestWishlist()
          return {};
        }
      },
      // Custom storage handler for guest mode
      storage: {
        getItem: () => null, // Guest wishlist loaded via loadGuestWishlist()
        setItem: () => {}, // Guest wishlist saved via saveGuestWishlist()
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);
