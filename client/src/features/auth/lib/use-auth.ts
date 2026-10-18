'use client';

import { authService } from '@/shared/api/services/auth-service';
import { removeToken as removeCookieToken } from '@/shared/lib/auth';
import { devLog } from '@/shared/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useUserStore } from '../model/user.store';

// Import auth constants from centralized location
import {
  AUTH_EVENTS,
  BROADCAST_DEBOUNCE_MS,
  MAX_REFRESH_INTERVAL_MS,
  REFRESH_401_COOLDOWN_MS,
} from '@/shared/lib/auth-constants';
import { closeAuthBroadcastChannel, getAuthBroadcastChannel } from '@/shared/lib/broadcast-channel';

// CRITICAL: Cookie-only approach - token functions removed
// Backend handles token expiration via httpOnly cookies
// Frontend uses fixed refresh interval

/**
 * Извлекает статус код из ошибки API
 */
const getErrorStatusCode = (error: unknown): number | null => {
  if (error && typeof error === 'object' && 'status' in error) {
    return typeof error.status === 'number' ? error.status : null;
  }
  // Проверяем сообщение об ошибке на наличие статус кода
  if (error instanceof Error) {
    const match = error.message.match(/status[:\s]+(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return null;
};

/**
 * Хук управления аутентификацией пользователя.
 * Выполняет инициализацию токена из cookie, автоматический рефреш по exp токена, обработку ошибок.
 *
 * Все данные пользователя берутся из userStore.
 * Поддерживает SSR-friendly восстановление сессии (через cookie).
 * Поддерживает multi-tab синхронизацию через BroadcastChannel.
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  const {
    user,
    token,
    // CRITICAL: refreshToken is NOT in store - it's only in httpOnly cookie
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    logout,
    setToken: setStoreToken,
    setUser,
    clearError,
  } = useUserStore();

  // Для предотвращения race condition при асинхронном обновлении токена
  const isRefreshingRef = useRef(false);
  // Для хранения таймера refresh
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Для multi-tab синхронизации
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  // Debounce timer for BroadcastChannel events
  const broadcastDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Last processed event timestamp to prevent duplicate handling
  const lastEventTimestampRef = useRef<number>(0);
  // Счетчик неудачных попыток refresh для защиты от бесконечных циклов
  const failedRefreshAttemptsRef = useRef<number>(0);
  // Cooldown после 401 от refresh (предотвращает массовые запросы)
  const lastRefreshFailure401Ref = useRef<number>(0);
  // Track if merge has been triggered for current login session
  const mergeTriggeredRef = useRef<boolean>(false);

  // Сессия и isInitialized выставляются в user.store onRehydrateStorage (getProfile / refresh).
  // Не вызываем setInitialized(true) здесь: это гоняло с rehydrate и ломало восстановление сессии.

  // CRITICAL: Trigger idempotent merge after successful login
  // Merge is NOT part of auth flow - it's a best-effort background sync
  // Executes only once per login session, independent for cart and wishlist
  useEffect(() => {
    const { authStatus } = useUserStore.getState();

    // GUARD 1: Only trigger when auth is resolved AND authenticated
    // CRITICAL: Do NOT trigger merge while authStatus === 'unknown' (rehydration in progress)
    if (authStatus === 'unknown' || !isAuthenticated || !isInitialized) {
      // Reset merge trigger flag when user logs out or auth is unresolved
      if (authStatus === 'unauthenticated' || !isAuthenticated) {
        mergeTriggeredRef.current = false;
      }
      return;
    }

    // GUARD 2: Only trigger once per login session
    if (mergeTriggeredRef.current) {
      return;
    }

    mergeTriggeredRef.current = true;
    lastRefreshFailure401Ref.current = 0; // Reset refresh cooldown after successful login

    // Trigger merge for cart and wishlist independently (no Promise.all)
    // Each store handles its own idempotent merge logic
    const triggerMerge = async () => {
      try {
        const { useCartStore } = await import('@/entities/cart');
        const { useWishlistStore } = await import('@/entities/wishlist');

        const cartStore = useCartStore.getState();
        const wishlistStore = useWishlistStore.getState();

        // Trigger merge independently - no Promise.all
        // Each store's tryMergeOnce() handles idempotency internally
        cartStore.tryMergeOnce().catch((error) => {
          devLog.error('[useAuth] Cart merge failed:', error);
          // Non-blocking - merge failure doesn't affect auth
        });

        wishlistStore.tryMergeOnce().catch((error) => {
          devLog.error('[useAuth] Wishlist merge failed:', error);
          // Non-blocking - merge failure doesn't affect auth
        });

        devLog.log('🔄 [useAuth] Triggered idempotent merge for cart and wishlist');
      } catch (error) {
        devLog.error('[useAuth] Failed to trigger merge:', error);
        // Non-critical - reset flag to allow retry on next render
        mergeTriggeredRef.current = false;
      }
    };

    // Trigger merge asynchronously (non-blocking)
    triggerMerge();
  }, [isAuthenticated, isInitialized]); // Note: authStatus is read inside effect but not in deps
  // This is acceptable because authStatus changes usually accompany isAuthenticated changes
  // and the effect correctly checks authStatus inside the guard

  // Multi-tab синхронизация через BroadcastChannel
  // CRITICAL: Use global singleton channel instead of creating new one
  useEffect(() => {
    const channel = getAuthBroadcastChannel();
    if (!channel) {
      return;
    }

    broadcastChannelRef.current = channel;

    // Слушаем события от других вкладок с debouncing
    // Предотвращает duplicate API calls при быстрых последовательных событиях
    const handleMessage = (event: MessageEvent) => {
      const { type, payload, timestamp } = event.data;

      // Debounce: игнорируем события с тем же timestamp (duplicate)
      if (timestamp && timestamp === lastEventTimestampRef.current) {
        devLog.log('[useAuth] Ignoring duplicate BroadcastChannel event:', type);
        return;
      }
      lastEventTimestampRef.current = timestamp || Date.now();

      // Clear previous debounce timer
      if (broadcastDebounceRef.current) {
        clearTimeout(broadcastDebounceRef.current);
      }

      // Debounce handler to prevent rapid duplicate processing
      broadcastDebounceRef.current = setTimeout(() => {
        switch (type) {
          case AUTH_EVENTS.LOGOUT:
            // Другая вкладка вышла - выходим и здесь
            // CRITICAL: Очищаем таймер refresh ДО logout (как в handleLogout)
            // Это предотвращает бесконечный цикл refresh после logout
            if (refreshTimerRef.current) {
              clearTimeout(refreshTimerRef.current);
              refreshTimerRef.current = null;
            }
            isRefreshingRef.current = false;

            removeCookieToken();
            logout();

            // Очищаем только приватные кеши (как в handleLogout)
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['review-stats'] });

            queryClient.removeQueries({ queryKey: ['user'] });
            queryClient.removeQueries({ queryKey: ['orders'] });
            queryClient.removeQueries({ queryKey: ['addresses'] });
            queryClient.removeQueries({ queryKey: ['wishlist'] });
            queryClient.removeQueries({ queryKey: ['cart'] });
            queryClient.removeQueries({ queryKey: ['review-stats'] });
            break;

          case AUTH_EVENTS.TOKEN_REFRESHED:
            // Другая вкладка обновила токен - синхронизируем Zustand store
            // CRITICAL: Backend sets httpOnly cookies, NOT frontend
            // Cookie-only approach - no token in payload
            // Just invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['user'] });
            break;

          case AUTH_EVENTS.OTP_VERIFIED:
          case AUTH_EVENTS.LOGIN: // Оставляем для обратной совместимости
            // Другая вкладка вошла через OTP - синхронизируем состояние
            // CRITICAL: Backend sets httpOnly cookies, NOT frontend
            // Cookie-only approach - no token in payload
            if (payload?.user) {
              // Обновляем user в store
              setUser(payload.user);
              // Устанавливаем флаги аутентификации
              useUserStore.setState({
                isAuthenticated: true,
                isInitialized: true,
                token: null, // Always null - cookie-only approach
                authStatus: 'authenticated', // CRITICAL: Mark as authenticated after receiving OTP_VERIFIED event
              });
            }
            // Инвалидируем кеш для обновления данных
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            break;

          default:
            break;
        }
      }, BROADCAST_DEBOUNCE_MS);
    };

    channel.onmessage = handleMessage;

    return () => {
      // CRITICAL: Don't close global channel - it's a singleton kept open for session
      // Only clear ref, channel will be closed on logout or app unmount
      broadcastChannelRef.current = null;
      // Clear debounce timer on cleanup
      if (broadcastDebounceRef.current) {
        clearTimeout(broadcastDebounceRef.current);
        broadcastDebounceRef.current = null;
      }
    };
  }, [logout, setStoreToken, setUser, queryClient]);

  // Автоматический рефреш токена на основе exp, если пользователь аутентифицирован
  // CRITICAL: refreshToken is in httpOnly cookie, NOT in store
  useEffect(() => {
    // CRITICAL: Early exit if user is not authenticated
    // This prevents refresh attempts after logout
    if (!isAuthenticated) {
      // Очищаем таймер если он был установлен
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      // Также очищаем флаг refreshing для предотвращения застревания
      isRefreshingRef.current = false;
      // Сбрасываем счетчик неудачных попыток
      failedRefreshAttemptsRef.current = 0;
      return;
    }

    // CRITICAL: Cookie-only approach - token is always null in frontend
    // Refresh timer works based on isAuthenticated flag, not token presence
    // Backend handles token expiration via httpOnly cookies

    let cancelled = false;

    const scheduleRefresh = () => {
      // Очищаем предыдущий таймер если есть
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      if (cancelled) return;

      // CRITICAL: Cookie-only approach - use fixed interval since we don't have token
      // Backend handles token expiration, we just refresh periodically
      // Use default refresh interval (e.g., every 15 minutes)
      const delay = MAX_REFRESH_INTERVAL_MS || 15 * 60 * 1000; // 15 minutes default

      refreshTimerRef.current = setTimeout(() => {
        // CRITICAL: Check authentication state again before executing refresh
        // User might have logged out while timer was running
        const currentState = useUserStore.getState();
        if (!cancelled && currentState.isAuthenticated) {
          refreshAuthToken();
        } else {
          devLog.warn('[useAuth] Skipping scheduled refresh - user logged out');
          isRefreshingRef.current = false;
        }
      }, delay);
    };

    const refreshAuthToken = async () => {
      // CRITICAL: Double-check authentication state before attempting refresh
      // Cookie-only: token is NOT in store (always null), only isAuthenticated matters
      const currentAuthState = useUserStore.getState();

      if (!currentAuthState.isAuthenticated) {
        devLog.warn('[useAuth] Skipping refresh - user not authenticated');
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
        isRefreshingRef.current = false;
        failedRefreshAttemptsRef.current = 0;
        return;
      }

      // Cooldown после 401 от refresh: не спамить бэкенд при отсутствии cookie
      if (
        lastRefreshFailure401Ref.current > 0 &&
        Date.now() - lastRefreshFailure401Ref.current < REFRESH_401_COOLDOWN_MS
      ) {
        devLog.warn('[useAuth] Skipping refresh - within 401 cooldown');
        isRefreshingRef.current = false;
        return;
      }

      // Защита от бесконечных циклов: если было 3+ неудачных попыток подряд, делаем logout
      if (failedRefreshAttemptsRef.current >= 3) {
        devLog.error('[useAuth] Too many failed refresh attempts, logging out');
        // Clear any scheduled timers
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
        isRefreshingRef.current = false;
        failedRefreshAttemptsRef.current = 0;

        // Уведомляем другие вкладки о logout
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: AUTH_EVENTS.LOGOUT,
            timestamp: Date.now(),
          });
        }

        await logout();
        return;
      }

      // CRITICAL: Cookie-only approach - no token expiration check
      // Backend handles token expiration, we just refresh periodically

      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;

      try {
        // CRITICAL: refreshToken is read from httpOnly cookie by backend, NOT passed as parameter
        const response = await authService.refreshToken();
        if (response.token) {
          // CRITICAL: Backend sets httpOnly cookies automatically
          // Frontend should NOT set cookies - only update Zustand store
          setStoreToken(response.token);

          // Сбрасываем счетчик неудачных попыток при успешном refresh
          failedRefreshAttemptsRef.current = 0;

          // Уведомляем другие вкладки о refresh (cookie-only approach - no token in payload)
          if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
              type: AUTH_EVENTS.TOKEN_REFRESHED,
              payload: {
                // CRITICAL: Token NOT sent - cookie-only approach
                // Backend handles tokens via httpOnly cookies
              },
              timestamp: Date.now(),
            });
          }

          // Инвалидируем кеш авторизации/пользователя
          queryClient.invalidateQueries({ queryKey: ['user'] });

          // Планируем следующий refresh
          scheduleRefresh();
        } else {
          devLog.error('[useAuth] Invalid token response:', response);
          // Увеличиваем счетчик неудачных попыток
          failedRefreshAttemptsRef.current += 1;
          logout();
        }
      } catch (error) {
        const statusCode = getErrorStatusCode(error);
        devLog.error('[useAuth] Token refresh failed:', error);

        // CRITICAL: Check authentication state again before logout
        // This prevents infinite loops if logout was already called
        const authStateAfterError = useUserStore.getState();
        if (!authStateAfterError.isAuthenticated) {
          devLog.warn('[useAuth] User already logged out, skipping refresh error handling');
          isRefreshingRef.current = false;
          return;
        }

        // Logout только при 401/403 (неавторизован/запрещено)
        if (statusCode === 401 || statusCode === 403) {
          failedRefreshAttemptsRef.current += 1;
          lastRefreshFailure401Ref.current = Date.now();

          if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
          }

          if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
              type: AUTH_EVENTS.LOGOUT,
              timestamp: Date.now(),
            });
          }

          failedRefreshAttemptsRef.current = 0;
          await logout();
        } else {
          // Для других ошибок (сеть, 500, etc.) планируем retry через минимальный интервал
          // Но только если пользователь еще аутентифицирован и не превышен лимит попыток
          if (authStateAfterError.isAuthenticated && failedRefreshAttemptsRef.current < 3) {
            // Увеличиваем счетчик неудачных попыток для сетевых ошибок
            failedRefreshAttemptsRef.current += 1;
            devLog.warn('[useAuth] Retrying refresh after network error', {
              attempt: failedRefreshAttemptsRef.current,
            });
            refreshTimerRef.current = setTimeout(() => {
              if (!cancelled && useUserStore.getState().isAuthenticated) {
                refreshAuthToken();
              }
            }, 60000); // 1 minute retry delay for network errors
          } else {
            // Превышен лимит попыток или пользователь не аутентифицирован
            devLog.error('[useAuth] Too many failed refresh attempts or user not authenticated');
            failedRefreshAttemptsRef.current = 0;
          }
        }
      } finally {
        isRefreshingRef.current = false;
      }
    };

    // CRITICAL: Cookie-only approach - always schedule refresh
    // Backend handles token expiration, we just refresh periodically
    scheduleRefresh();

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      // Очищаем флаг refreshing при размонтировании
      isRefreshingRef.current = false;
    };
  }, [isAuthenticated, logout, setStoreToken, queryClient]);

  /**
   * Явный выход пользователя. Чистит cookie, store, cache.
   * Уведомляет другие вкладки через BroadcastChannel.
   *
   * CRITICAL:
   * - Saves current cart/wishlist as guest before logout
   * - Restores guest cart/wishlist after logout
   * - Handled by user.store.ts logout method
   */
  const handleLogout = useCallback(async () => {
    // CRITICAL: Очищаем таймер refresh ДО logout для предотвращения бесконечного цикла
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    isRefreshingRef.current = false;

    // CRITICAL: Explicit order of operations for logout cleanup
    // 1. Invalidate React Query queries FIRST (before state changes)
    //    This ensures cached data is cleared before logout completes
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['addresses'] });
    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    queryClient.invalidateQueries({ queryKey: ['cart'] });
    queryClient.invalidateQueries({ queryKey: ['review-stats'] });

    // Remove private data from cache
    queryClient.removeQueries({ queryKey: ['user'] });
    queryClient.removeQueries({ queryKey: ['orders'] });
    queryClient.removeQueries({ queryKey: ['addresses'] });

    // 2. Call logout (handles: save cart/wishlist, backend logout, clear storage, reset state, load guest data)
    // NOTE: removeCookieToken is called inside logout if needed, but httpOnly cookies are cleared by backend
    await logout();

    // 3. BroadcastChannel notification (last - after all cleanup)
    // Уведомляем другие вкладки с timestamp для deduplication
    // Используем глобальный channel (singleton)
    const channel = getAuthBroadcastChannel();
    if (channel) {
      channel.postMessage({
        type: AUTH_EVENTS.LOGOUT,
        timestamp: Date.now(),
      });
    }

    // 4. Close global BroadcastChannel on logout (cleanup)
    closeAuthBroadcastChannel();
    queryClient.removeQueries({ queryKey: ['wishlist'] });
    queryClient.removeQueries({ queryKey: ['cart'] });
    queryClient.removeQueries({ queryKey: ['review-stats'] });
  }, [logout, queryClient]);

  /**
   * Сбрасывает ошибку аутентификации.
   */
  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  return {
    user,
    token,
    // CRITICAL: refreshToken is NOT exposed - it's only in httpOnly cookie
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    logout: handleLogout,
    clearError: handleClearError,
    setUser,
    setToken: setStoreToken,
  };
};
