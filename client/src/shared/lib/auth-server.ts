import { decodeToken, isTokenExpired, type JwtPayload } from '@/shared/lib/auth';
import type { NextRequest } from 'next/server';

/**
 * Server-only session verification
 *
 * CRITICAL SECURITY NOTES:
 * - This is server-side only (not Edge Runtime)
 * - Only DECODES tokens (no signature verification - backend is source of truth)
 * - Used in Server Components and API routes
 * - Decoded token = optimistic UI, backend API response = authoritative
 *
 * @param request - Next.js request object
 * @returns Session data with user payload and token, or null if not authenticated
 */
export function verifySession(
  request: NextRequest,
): { user: JwtPayload | null; token: string | null } {
  // CRITICAL: Cookie name must match backend: 'accessToken'
  const accessToken = request.cookies.get('accessToken')?.value;

  if (!accessToken) {
    return { user: null, token: null };
  }

  // Check if token is expired (client-side check only)
  if (isTokenExpired(accessToken)) {
    return { user: null, token: null };
  }

  // Decode token (no signature verification - backend does that)
  const decoded = decodeToken(accessToken);
  if (!decoded) {
    return { user: null, token: null };
  }

  return { user: decoded, token: accessToken };
}

/**
 * Check if user is authenticated (server-side)
 *
 * @param request - Next.js request object
 * @returns true if user has valid token, false otherwise
 */
export function isAuthenticated(request: NextRequest): boolean {
  const { user } = verifySession(request);
  return user !== null;
}
