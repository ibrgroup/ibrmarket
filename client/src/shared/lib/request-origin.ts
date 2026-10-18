import type { NextRequest } from 'next/server';

/**
 * Frontend and API on different hosts (e.g. Vercel + Render).
 * Next.js never sees httpOnly auth cookies from the API domain.
 */
export function isApiCrossOriginFromRequest(request: NextRequest): boolean {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (!apiUrl) return false;
  try {
    const apiHost = new URL(apiUrl).hostname.toLowerCase();
    const requestHost = request.nextUrl.hostname.toLowerCase();
    return apiHost !== requestHost;
  } catch {
    return false;
  }
}

/** `host` from `headers().get('host')` (may include port). */
export function isApiCrossOriginFromHost(hostHeader: string | null): boolean {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (!apiUrl || !hostHeader) return false;
  try {
    const apiHost = new URL(apiUrl).hostname.toLowerCase();
    const requestHost = hostHeader.split(':')[0]?.toLowerCase() ?? '';
    return apiHost !== requestHost;
  } catch {
    return false;
  }
}
