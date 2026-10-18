import type { User } from '@/entities/user';
import { apiClient } from '@/shared/api';
import { authService } from '@/shared/api/services/auth-service';
import { userService } from '@/shared/api/services/user-service';
import { removeToken as removeCookieToken } from '@/shared/lib/auth';
import { handleAuthError } from '@/shared/lib/auth-error-handler';
import { getAuthBroadcastChannel } from '@/shared/lib/broadcast-channel';
import { devLog } from '@/shared/lib/logger';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Без этого на SSR/первом импорте без window zustand отключает persist целиком,
 * и onRehydrateStorage с getProfile() никогда не вызывается.
 */
const userPersistStorage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? localStorage
    : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
);

/**
 * Нормализует данные пользователя из API, преобразуя mobile -> phone
 * для соответствия интерфейсу User
 */
function normalizeUser(user: any): User | null {
  if (!user) return null;

  const phone =
    user.phone ??
    (user.mobile !== undefined && user.mobile !== null ? String(user.mobile) : undefined);

  let address = user.address ?? undefined;
  if (!address && Array.isArray(user.address_details) && user.address_details.length > 0) {
    const sel = user.address_details.find((a: any) => a.selected) || user.address_details[0];
    if (sel) {
      const parts = [sel.address_line1, sel.city, sel.state, sel.pincode, sel.country].filter(
        Boolean,
      );
      address = parts.join(', ');
    }
  }

  return {
    ...user,
    phone,
    address,
  } as User;
}

export interface UserState {
  // State
  user: User | null;
  token: null; // CRITICAL: Always null - cookie-only approach. Token exists only in httpOnly cookie (backend)
  // CRITICAL: refreshToken is NOT stored here - it's only in httpOnly cookie
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // CRITICAL: Auth resolution status to prevent race conditions
  // 'unknown' = auth state is being restored from cookies (rehydration in progress)
  // 'authenticated' = user is authenticated (confirmed via API)
  // 'unauthenticated' = user is not authenticated (confirmed via API or explicit logout)
  authStatus: 'unknown' | 'authenticated' | 'unauthenticated';

  // Actions - NEW OTP methods
  sendOtp: (data: { contact: string; method: 'email' | 'phone'; name?: string }) => Promise<void>;
  verifyOtp: (data: { contact: string; otp: string; method: 'email' | 'phone' }) => Promise<void>;

  // Actions - ACTIVE
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    data: Partial<Pick<User, 'name' | 'email' | 'phone' | 'address'>>,
  ) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  clearError: () => void;
  setInitialized: (initialized: boolean) => void;
}

/**
 * Глобальный стор пользователя.
 *
 * Вынесен в `entities/user`, чтобы его могли использовать нижележащие слои
 * (например, `shared/api`), не нарушая FSD.
 */
// CRITICAL: Store set function for use in onRehydrateStorage
// This prevents circular import: store doesn't import itself
// We'll capture set from factory and use it in onRehydrateStorage
let storeSet: ((partial: Partial<UserState>) => void) | null = null;

/**
 * Guard function to ensure storeSet is initialized before use
 * Prevents undefined behavior during edge cases (SSR, early rehydration, etc.)
 */
function assertStoreReady(): boolean {
  if (!storeSet) {
    if (process.env.NODE_ENV === 'development') {
      devLog.warn('[UserStore] storeSet is not ready during rehydration - this should not happen');
    }
    return false;
  }
  return true;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      // Capture set for use in onRehydrateStorage
      storeSet = set;

      return {
        // Initial state
        user: null,
        token: null, // CRITICAL: Always null - cookie-only approach
        // CRITICAL: refreshToken is NOT stored - it's only in httpOnly cookie
        isAuthenticated: false,
        isLoading: false,
        isInitialized: false,
        error: null,
        authStatus: 'unknown' as const, // CRITICAL: Start as unknown - will be resolved during rehydration

        // ============================================================
        // OTP AUTHENTICATION METHODS
        // ============================================================
        sendOtp: async (data) => {
          devLog.log('📧 [UserStore] Отправка OTP кода:', {
            contact: data.contact,
            method: data.method,
          });
          set({ isLoading: true, error: null });
          try {
            await authService.sendOtp(data);
            devLog.log('✅ [UserStore] OTP код отправлен успешно');
            set({ isLoading: false });
          } catch (error) {
            const authError = handleAuthError(error);
            set({ error: authError.message, isLoading: false });
            throw error;
          }
        },

        verifyOtp: async (data) => {
          devLog.log('🔐 [UserStore] Верификация OTP кода:', {
            contact: data.contact,
            method: data.method,
          });
          set({ isLoading: true, error: null });
          try {
            const response = await authService.verifyOtp(data);

            // CRITICAL: Backend sets accessToken as httpOnly cookie automatically
            // Frontend should NOT set cookies - backend is the only source of truth
            // CRITICAL: Token is NOT stored in frontend - cookie-only approach
            // Backend handles all token operations via httpOnly cookies

            // Set loading state
            set({ isLoading: true, error: null });

            // Fetch profile with single retry (max 1 attempt)
            let profile: User | null = null;
            try {
              profile = await userService.getProfile();
            } catch (error) {
              // Single retry - if backend is temporarily unavailable
              try {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                profile = await userService.getProfile();
              } catch (retryError) {
                // After retry fails, use response.user as fallback
                devLog.warn(
                  '⚠️ [UserStore] Failed to fetch profile after retry, using response.user:',
                  retryError,
                );
                profile = normalizeUser(response.user);
              }
            }

            // Set all state atomically (no token - cookie-only)
            const normalizedProfile = normalizeUser(profile);
            set({
              user: normalizedProfile,
              isAuthenticated: true,
              isInitialized: true, // Atomic with user
              isLoading: false,
              token: null, // Always null - cookie-only approach
              authStatus: 'authenticated', // CRITICAL: Mark as authenticated after successful OTP verification
            });

            apiClient.clearRefreshCooldown(); // Сброс cooldown после успешного входа

            // CRITICAL: Уведомляем другие вкладки о успешном входе
            // Это позволяет синхронизировать состояние между вкладками
            // Используем глобальный BroadcastChannel instance (singleton pattern)
            try {
              const channel = getAuthBroadcastChannel();
              if (channel) {
                channel.postMessage({
                  type: 'OTP_VERIFIED',
                  payload: {
                    user: normalizedProfile,
                    // CRITICAL: Token NOT sent - cookie-only approach. Backend handles tokens via httpOnly cookies
                  },
                  timestamp: Date.now(),
                });
                // CRITICAL: Don't close channel - it's a global singleton kept open for session
              }
            } catch (error) {
              devLog.warn('[UserStore] Failed to notify other tabs about login:', error);
            }

            // CRITICAL: Merge is NOT part of auth flow
            // Auth is successful regardless of merge status
            // Merge will be triggered separately after login (see useAuth hook)
            // This ensures login never fails due to merge errors
          } catch (error) {
            const authError = handleAuthError(error);
            const statusCode = authError.statusCode;

            // Invalid OTP or expired OTP - stay in LOGGING_IN
            // User can retry with correct code
            if (statusCode === 400 || statusCode === 401) {
              set({
                error: authError.message,
                isLoading: false,
                // CRITICAL: Stay in LOGGING_IN, don't set isAuthenticated: false
                // User can retry OTP verification
              });
              throw error;
            }

            // Critical errors (network, 500, etc.) - transition to GUEST
            set({
              error: authError.message,
              isLoading: false,
              isAuthenticated: false, // Only for critical errors
            });
            throw error;
          }
        },

        // ============================================================
        logout: async () => {
          devLog.log('🚪 [UserStore] Starting logout process...');

          // CRITICAL: Explicit order of operations for logout cleanup
          // Order matters to prevent race conditions and ensure data consistency
          //
          // 1. Save authenticated cart/wishlist as guest (BEFORE backend logout)
          //    This ensures data is preserved even if backend logout fails
          try {
            // Dynamically import to avoid circular dependencies
            const { useCartStore } = await import('@/entities/cart');
            const { useWishlistStore } = await import('@/entities/wishlist');

            const cartState = useCartStore.getState();
            const wishlistState = useWishlistStore.getState();

            // Save authenticated cart/wishlist as guest (if any items)
            if (cartState.items.length > 0) {
              devLog.log('💾 [UserStore] Saving authenticated cart as guest before logout');
              cartState.saveGuestCart();
            }

            if (wishlistState.items.length > 0) {
              devLog.log('💾 [UserStore] Saving authenticated wishlist as guest before logout');
              wishlistState.saveGuestWishlist();
            }
          } catch (error) {
            devLog.error('⚠️ [UserStore] Failed to save cart/wishlist as guest:', error);
          }

          // 2. Call backend logout endpoint and AWAIT it
          // Backend will:
          //    - Invalidate refresh token in DB
          //    - Clear httpOnly cookies (accessToken, refreshToken)
          //
          // SECURITY: Always call backend logout
          // - Backend auth middleware can extract userId from httpOnly cookie
          // - This ensures refresh token is invalidated in DB
          // - Prevents security vulnerability where refresh token remains valid after logout
          try {
            // Always attempt backend logout - backend reads from httpOnly cookie
            // No token parameter needed - cookie-only approach
            await authService.logout();
            devLog.log('✅ [UserStore] Backend logout successful');
          } catch (error) {
            // Log error but continue with frontend cleanup
            // Even if backend fails, we should clear frontend state
            devLog.error('❌ [UserStore] Backend logout failed:', error);
            // Don't throw - continue with frontend cleanup
          }

          // CRITICAL: Do NOT manually clear cookies here
          // httpOnly cookies can only be cleared by backend via res.clearCookie()
          // Frontend cannot access httpOnly cookies via document.cookie
          // Backend already cleared them in the logout endpoint above

          // 3. Clear persisted storage (BEFORE state reset)
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('user-storage');
            } catch (error) {
              devLog.error('Failed to clear user storage:', error);
            }
          }

          // 4. Reset Zustand state atomically (AFTER persisted storage cleared)
          set({
            user: null,
            token: null,
            // refreshToken is in httpOnly cookie, cleared by backend on logout
            isAuthenticated: false,
            error: null,
            isInitialized: true, // Mark as initialized - guest mode is valid
            isLoading: false,
            authStatus: 'unauthenticated', // CRITICAL: Explicitly mark as unauthenticated after logout
          });

          // 5. Clear guestId for creating new one on next guest session
          try {
            const { clearGuestId } = await import('@/shared/lib/guest-id');
            clearGuestId();
            devLog.log('🗑️ [UserStore] Cleared guest ID on logout');
          } catch (error) {
            devLog.error('⚠️ [UserStore] Failed to clear guest ID:', error);
          }

          // 6. Load guest cart/wishlist (AFTER state reset)
          try {
            const { useCartStore } = await import('@/entities/cart');
            const { useWishlistStore } = await import('@/entities/wishlist');

            devLog.log('📦 [UserStore] Restoring guest cart/wishlist after logout');
            useCartStore.getState().loadGuestCart();
            useWishlistStore.getState().loadGuestWishlist();
          } catch (error) {
            devLog.error('⚠️ [UserStore] Failed to restore guest cart/wishlist:', error);
          }

          // NOTE: React Query invalidation should be done in useAuth hook
          // (queryClient is only available in React components via useQueryClient)
          // This is handled in useAuth hook which calls logout()

          devLog.log('✅ [UserStore] Logout process completed');
        },

        refreshProfile: async () => {
          // Cookie-only: token is always null; check isAuthenticated so profile refresh works after login
          const { isAuthenticated } = get();
          if (!isAuthenticated) return;
          set({ isLoading: true });
          try {
            const profile = await userService.getProfile();
            set({ user: profile, isLoading: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to refresh profile';
            set({ error: message, isLoading: false });
          }
        },

        updateProfile: async (data) => {
          const { user } = get();
          if (!user) throw new Error('User not authenticated');

          // Трансформируем phone -> mobile для соответствия API бэкенда
          const backendData = {
            ...data,
            mobile: data.phone,
          };
          delete (backendData as any).phone;

          set({ isLoading: true, error: null });
          try {
            const updatedUser = await userService.updateProfile(user._id, backendData);

            const finalUser: User = {
              ...updatedUser,
              phone: 'phone' in data ? (data.phone ?? '') : (updatedUser.phone ?? user.phone ?? ''),
              address:
                'address' in data
                  ? (data.address ?? '')
                  : (updatedUser.address ?? user.address ?? ''),
              name: 'name' in data ? (data.name ?? '') : (updatedUser.name ?? user.name ?? ''),
              email: 'email' in data ? (data.email ?? '') : (updatedUser.email ?? user.email ?? ''),
            };

            set({ user: finalUser, isLoading: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update profile';
            set({ error: message, isLoading: false });
            throw error;
          }
        },

        updateAvatar: async (file) => {
          const { user } = get();
          if (!user) throw new Error('User not authenticated');

          set({ isLoading: true, error: null });
          try {
            const formData = new FormData();
            formData.append('avatar', file);
            const result = await userService.updateAvatar(formData);
            const updatedUser = { ...user, avatar: result.avatar };
            set({ user: updatedUser, isLoading: false });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update avatar';
            set({ error: message, isLoading: false });
            throw error;
          }
        },

        setToken: (token) => {
          // CRITICAL: Cookie-only approach - token is always null in frontend
          // Backend is the ONLY source for setting accessToken/refreshToken cookies
          // This method is kept for backward compatibility but always sets token to null

          if (typeof document !== 'undefined' && !token) {
            removeCookieToken();
          }

          // CRITICAL: Token is always null - cookie-only approach
          // isAuthenticated is determined by API calls, not by token presence
          const isAuth = !!token; // This will be false since token is always null
          set({
            token: null, // Always null - cookie-only approach
            isAuthenticated: isAuth,
            // If clearing, reset user and other flags
            ...(isAuth
              ? {}
              : {
                  user: null,
                  isInitialized: false,
                  authStatus: 'unauthenticated' as const, // CRITICAL: Mark as unauthenticated when clearing token
                }),
          });
        },

        setUser: (user) => {
          set({ user });
        },

        clearError: () => {
          set({ error: null });
        },

        setInitialized: (initialized) => {
          set({ isInitialized: initialized });
        },
      };
    },
    {
      name: 'user-storage',
      storage: userPersistStorage,
      // Явный rehydrate() на клиенте (см. UserStoreRehydrate) — надёжно для Next.js
      skipHydration: true,
      // Сохраняем только user и isAuthenticated для правильной rehydration
      // CRITICAL: token NOT persisted - cookie-only approach
      // Token exists only in httpOnly cookie (backend), not in frontend
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Token NOT persisted - cookie-only approach
        // CRITICAL: authStatus is NOT persisted - always starts as 'unknown' on rehydration
        // This prevents race conditions where guards fire before auth is restored from cookies
      }),
      onRehydrateStorage: () => (_persisted, storageError) => {
        if (storageError && process.env.NODE_ENV === 'development') {
          devLog.warn(
            '[UserStore] Ошибка чтения persist storage (всё равно пробуем API):',
            storageError,
          );
        }
        void (async () => {
          // CRITICAL: Use captured set from factory, NOT useUserStore.setState
          // This prevents circular import: store doesn't import itself
          // storeSet is captured from factory function via closure
          if (!assertStoreReady()) {
            // Early return if storeSet is not ready (edge case: SSR, early rehydration)
            // State will be initialized on next render cycle
            return;
          }

          const set = storeSet!; // Safe to use after assertStoreReady check

          // CRITICAL: Always check cookies via API, regardless of localStorage state
          // localStorage is just a cache - cookies are the source of truth
          // If localStorage is empty but cookies have valid tokens, user should remain authenticated
          //
          // Strategy:
          // 1. Always check API (backend reads httpOnly cookie)
          // 2. If API returns 200 → user is authenticated (even if localStorage was empty)
          // 3. If API returns 401 → user is guest (no valid cookies)
          //
          // This ensures that:
          // - Clearing localStorage doesn't log out user if cookies are valid
          // - Cookies are the single source of truth for authentication
          // - localStorage is just a cache for better UX (faster initial render)

          // CRITICAL: Set authStatus to 'unknown' while checking - prevents guards from firing
          set({
            isInitialized: false, // Mark as checking
            authStatus: 'unknown', // CRITICAL: Prevent guards/logout until auth is resolved
          });

          // CRITICAL: Always check cookies via API (backend reads httpOnly cookie)
          // This works even if localStorage is empty - cookies are the source of truth
          try {
            const profile = await userService.getProfile();

            // User is authenticated - backend read token from httpOnly cookie
            // This works even if localStorage was empty - cookies are valid!
            devLog.log('✅ [UserStore] User authenticated on rehydration (from cookies)');

            // Set state synchronously (no setTimeout needed)
            set({
              user: profile,
              isAuthenticated: true,
              isInitialized: true,
              token: null, // Always null - cookie-only approach
              authStatus: 'authenticated', // CRITICAL: Mark as authenticated after successful API check
            });

            // Load server cart/wishlist (NO merge on rehydration)
            // Merge only happens on login, not on page reload
            try {
              const { useCartStore } = await import('@/entities/cart');
              const { useWishlistStore } = await import('@/entities/wishlist');

              devLog.log('📦 [UserStore] Loading server cart/wishlist on rehydration (no merge)');
              await Promise.all([
                useCartStore.getState().syncWithServer(),
                useWishlistStore.getState().syncWithServer(),
              ]);
            } catch (syncError) {
              devLog.error(
                '⚠️ [UserStore] Failed to sync cart/wishlist on rehydration:',
                syncError,
              );
            }
          } catch (error) {
            const statusCode =
              error && typeof error === 'object' && 'status' in error
                ? (error as { status?: number }).status
                : null;

            // FIX "выкидывает в профиле": on 401 try refresh once before giving up (e.g. access expired but refresh cookie still valid)
            if (statusCode === 401) {
              try {
                await authService.refreshToken();
                const profileAfterRefresh = await userService.getProfile();
                devLog.log('✅ [UserStore] User authenticated on rehydration (after refresh)');
                set({
                  user: normalizeUser(profileAfterRefresh),
                  isAuthenticated: true,
                  isInitialized: true,
                  token: null,
                  authStatus: 'authenticated',
                });
                try {
                  const { useCartStore } = await import('@/entities/cart');
                  const { useWishlistStore } = await import('@/entities/wishlist');
                  devLog.log(
                    '📦 [UserStore] Loading server cart/wishlist on rehydration (after refresh)',
                  );
                  await Promise.all([
                    useCartStore.getState().syncWithServer(),
                    useWishlistStore.getState().syncWithServer(),
                  ]);
                } catch (syncErr) {
                  devLog.error(
                    '⚠️ [UserStore] Failed to sync cart/wishlist on rehydration:',
                    syncErr,
                  );
                }
                return; // Success after refresh — skip unauthenticated path
              } catch (refreshError) {
                // Refresh failed — proceed to guest mode below
                devLog.log(
                  '[UserStore] No valid cookies on rehydration (refresh failed) - guest mode',
                );
              }
            } else {
              devLog.warn('[UserStore] Auth check failed on rehydration:', error);
            }

            // Set state synchronously (no setTimeout needed)
            set({
              user: null,
              token: null,
              isAuthenticated: false, // Guest mode - valid state, not error
              isInitialized: true, // Mark as initialized - guest mode is valid
              authStatus: 'unauthenticated', // CRITICAL: Mark as unauthenticated after failed API check
              error: null, // CRITICAL: Don't set error for 401 - it's normal for expired sessions
            });

            // Load guest cart/wishlist for unauthenticated users
            try {
              const { useCartStore } = await import('@/entities/cart');
              const { useWishlistStore } = await import('@/entities/wishlist');

              devLog.log('📦 [UserStore] Loading guest cart/wishlist on rehydration (guest mode)');
              useCartStore.getState().loadGuestCart();
              useWishlistStore.getState().loadGuestWishlist();
            } catch (loadError) {
              devLog.error('⚠️ [UserStore] Failed to load guest cart/wishlist:', loadError);
            }
          }
        })();
      },
    },
  ),
);

// CRITICAL: Runtime invariant checks for development mode
// These checks help catch invariant violations early during development
if (process.env.NODE_ENV === 'development') {
  // Subscribe to state changes and check invariants
  useUserStore.subscribe((state) => {
    // Token invariant: token must always be null (cookie-only approach)
    if (state.token !== null) {
      console.error(
        '[Invariant Violation] token must be null (cookie-only approach), got:',
        state.token,
      );
    }

    // Authentication invariant: isAuthenticated === true only if user !== null (except during CHECKING)
    // During CHECKING, isInitialized is false, so we allow isAuthenticated: true with user: null
    if (state.isAuthenticated && !state.user && state.isInitialized) {
      console.error(
        '[Invariant Violation] isAuthenticated is true but user is null (and initialized)',
        {
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          isInitialized: state.isInitialized,
        },
      );
    }

    // Initialization invariant: if not initialized and not loading, but authenticated - warning
    if (!state.isInitialized && !state.isLoading && state.isAuthenticated) {
      console.warn('[Invariant Warning] Not initialized but authenticated and not loading', {
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized,
        isLoading: state.isLoading,
      });
    }
  });
}
