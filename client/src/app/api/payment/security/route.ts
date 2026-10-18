import { decodeToken, TOKEN_KEY } from '@/shared/lib/auth';
import { logger } from '@/shared/lib/logger';
import { applyRateLimit } from '@/shared/middleware/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

function backendHeaders(request: NextRequest, token: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const internalApiKey = process.env.INTERNAL_API_KEY;
  if (internalApiKey) headers['X-Internal-Api-Key'] = internalApiKey;
  const cookie = request.headers.get('cookie');
  if (cookie) headers['Cookie'] = cookie;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);
  return request.cookies.get(TOKEN_KEY)?.value || null;
}

/**
 * GET /api/payment/security
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, { limit: 30, window: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const token = getToken(request);
    let userId: string | null = null;
    if (token) {
      try {
        const payload = decodeToken(token);
        if (payload) userId = payload.userId || payload.id || null;
      } catch {
        /* ignore */
      }
    }

    if (!userId && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: true, message: 'Необходима авторизация' }, { status: 401 });
    }

    const baseUrl =
      typeof process.env.NEXT_PUBLIC_API_URL === 'string'
        ? process.env.NEXT_PUBLIC_API_URL
        : 'http://localhost:8000';

    if (!userId && process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        success: true,
        data: {
          twoFactorEnabled: false,
          notifications: {
            newLogins: true,
            paymentMethodChanges: true,
            suspiciousActivity: true,
          },
        },
      });
    }

    const backendResponse = await fetch(`${baseUrl}/api/payment/security`, {
      method: 'GET',
      headers: backendHeaders(request, token),
      cache: 'no-store',
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text().catch(() => 'Unknown error');
      logger.error('GET /api/payment/security backend error', {
        status: backendResponse.status,
        error: errorText,
      });
      return NextResponse.json(
        { error: true, message: 'Не удалось загрузить настройки' },
        { status: backendResponse.status || 500 },
      );
    }

    const raw = await backendResponse.json().catch(() => ({}));
    return NextResponse.json({ success: true, data: raw.data ?? raw });
  } catch (error) {
    logger.error(
      'GET /api/payment/security',
      { error: error instanceof Error ? error.message : 'Unknown' },
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: true, message: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/payment/security
 */
export async function PUT(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, { limit: 20, window: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const token = getToken(request);
    let userId: string | null = null;
    if (token) {
      try {
        const payload = decodeToken(token);
        if (payload) userId = payload.userId || payload.id || null;
      } catch {
        /* ignore */
      }
    }

    if (!userId && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: true, message: 'Необходима авторизация' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const baseUrl =
      typeof process.env.NEXT_PUBLIC_API_URL === 'string'
        ? process.env.NEXT_PUBLIC_API_URL
        : 'http://localhost:8000';

    if (!userId && process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ success: true, data: body });
    }

    const backendResponse = await fetch(`${baseUrl}/api/payment/security`, {
      method: 'PUT',
      headers: backendHeaders(request, token),
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text().catch(() => 'Unknown error');
      logger.error('PUT /api/payment/security backend error', {
        status: backendResponse.status,
        error: errorText,
      });
      return NextResponse.json(
        { error: true, message: 'Не удалось сохранить настройки' },
        { status: backendResponse.status || 500 },
      );
    }

    const raw = await backendResponse.json().catch(() => ({}));
    return NextResponse.json({ success: true, data: raw.data ?? raw });
  } catch (error) {
    logger.error(
      'PUT /api/payment/security',
      { error: error instanceof Error ? error.message : 'Unknown' },
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: true, message: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
