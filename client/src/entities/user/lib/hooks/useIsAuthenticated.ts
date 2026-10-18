import { useUserStore } from '../../model/user.store';

/**
 * Safe selector for checking authentication status
 *
 * CRITICAL: Never trust isAuthenticated if auth is not resolved
 * This prevents showing authenticated UI to guests during rehydration
 * and prevents guards/logout from firing before auth is restored from cookies
 *
 * During rehydration:
 * - authStatus starts as 'unknown' (auth being restored from cookies)
 * - Guards/logout MUST NOT fire while authStatus === 'unknown'
 * - Only after API check completes, authStatus becomes 'authenticated' or 'unauthenticated'
 *
 * @returns true only if:
 * 1. Auth status is resolved (not 'unknown')
 * 2. User is authenticated (`isAuthenticated: true`)
 * 3. State is initialized (`isInitialized: true`)
 * 4. User data is available (`user !== null`)
 *
 * @example
 * ```tsx
 * // ❌ Bad - may show authenticated UI or fire guards during rehydration
 * const { isAuthenticated } = useUserStore();
 * if (isAuthenticated) { // show profile }
 *
 * // ✅ Good - safe check that respects auth resolution state
 * const isAuthenticated = useIsAuthenticated();
 * if (isAuthenticated) { // show profile }
 * ```
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated, isInitialized, user, authStatus } = useUserStore();

  // CRITICAL: All conditions must be true, including authStatus !== 'unknown'
  // This prevents showing authenticated UI and firing guards during rehydration
  return (
    authStatus !== 'unknown' &&
    authStatus === 'authenticated' &&
    isAuthenticated &&
    isInitialized &&
    user !== null
  );
}
