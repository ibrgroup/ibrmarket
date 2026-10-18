import { decodeToken } from '@/shared/lib/auth';
import { isApiCrossOriginFromRequest } from '@/shared/lib/request-origin';
import { hasDashboardAccess } from '@/shared/lib/user-roles';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Пути, требующие авторизации
// NOTE: /wishlist is intentionally NOT protected - supports guest mode (localStorage)
// Only server API routes (/api/wishlist/*) require authentication
const protectedPaths = ['/my-account', '/my-orders', '/purchases', '/checkout', '/dashboard'];

/**
 * Cross-origin: frontend and API on different domains (e.g. Vercel + Render).
 * In that case accessToken/refreshToken cookies are on the API domain only,
 * so this middleware never sees them and would always redirect. We must skip
 * cookie-based redirect and let client-side auth (getProfile, ProtectedRoute) handle it.
 */
function isCrossOriginSetup(request: NextRequest): boolean {
  return isApiCrossOriginFromRequest(request);
}

// Пути для авторизованных пользователей (редирект на главную)
// CRITICAL: /login removed - auth modal approach, no dedicated login page
const authPaths = ['/verify-account']; // Removed /register - auto-register on OTP verify, forgot-password - not used

import { MIDDLEWARE_TOKEN_GRACE_PERIOD_SECONDS } from '@/shared/lib/auth-constants';

/**
 * Check if token is expired with grace period
 * Adds a buffer to prevent redirect loops when token is about to expire
 *
 * @param token - JWT token string
 * @returns true if token is expired (past grace period)
 */
function isTokenExpiredWithGrace(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || typeof decoded.exp !== 'number') {
      return true;
    }

    // Add grace period to handle edge cases where token expires
    // between proxy check and actual API call
    const expirationWithGrace = decoded.exp * 1000 - MIDDLEWARE_TOKEN_GRACE_PERIOD_SECONDS * 1000;
    return Date.now() >= expirationWithGrace;
  } catch {
    return true;
  }
}

/**
 * Next.js Proxy for authentication
 *
 * CRITICAL SECURITY NOTES:
 * - Uses Node.js Runtime (proxy runs in Node.js, not Edge)
 * - Only decodes tokens (no signature verification - backend is source of truth)
 * - refreshToken is in httpOnly cookie, not accessible here
 * - Cannot call backend API for refresh (must be client-side)
 * - Uses grace period to prevent redirect loops near token expiration
 *
 * EDGE CASE HANDLING:
 * - Grace period prevents redirect loops when token expires during page load
 * - Client-side refresh will handle actual token refresh
 * - Backend is source of truth for token validation
 *
 * @param request - Next.js request object
 * @returns NextResponse with redirect or next()
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверяем accessToken в cookies (для SSR)
  // CRITICAL: Cookie name must match backend: 'accessToken' (not 'auth_token')
  const accessToken = request.cookies.get('accessToken')?.value;

  // Проверяем защищенные пути
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    // Edge case: если пользователь на auth path с истекшим токеном, не редиректим
    if (authPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // CRITICAL: Cross-origin (e.g. Vercel + Render): cookies are on API domain only.
    // This middleware cannot see them → do NOT redirect; let client-side auth handle it.
    if (isCrossOriginSetup(request)) {
      return NextResponse.next();
    }

    // Use grace period to prevent redirect loops when token is about to expire
    // Client-side useAuth() hook will handle actual refresh
    if (!accessToken || isTokenExpiredWithGrace(accessToken)) {
      // CRITICAL: Redirect to home with auth intent instead of non-existent /login
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('auth', 'required');
      if (pathname !== '/') {
        homeUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(homeUrl);
    }

    if (pathname.startsWith('/dashboard')) {
      const decoded = decodeToken(accessToken);
      if (decoded?.role && !hasDashboardAccess(decoded.role)) {
        const homeUrl = new URL('/', request.url);
        homeUrl.searchParams.set('forbidden', 'admin');
        return NextResponse.redirect(homeUrl);
      }
    }
  }

  // Проверяем публичные пути авторизации (редиректим авторизованных пользователей)
  if (authPaths.some((path) => pathname.startsWith(path))) {
    // For auth paths, be more lenient - only redirect if token is clearly valid
    // This prevents redirect loops and lets client-side handle edge cases
    if (accessToken && !isTokenExpiredWithGrace(accessToken)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
