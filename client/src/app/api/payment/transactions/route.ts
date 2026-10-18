import { decodeToken, TOKEN_KEY } from '@/shared/lib/auth';
import { logger } from '@/shared/lib/logger';
import { applyRateLimit } from '@/shared/middleware/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/payment/transactions — прокси на backend; история платежей по заказам.
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, { limit: 30, window: 60 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    let token: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = request.cookies.get(TOKEN_KEY)?.value || null;
    }

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

    if (!userId && process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ success: true, data: [] });
    }

    const baseUrl =
      typeof process.env.NEXT_PUBLIC_API_URL === 'string'
        ? process.env.NEXT_PUBLIC_API_URL
        : 'http://localhost:8000';

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const internalApiKey = process.env.INTERNAL_API_KEY;
    if (internalApiKey) headers['X-Internal-Api-Key'] = internalApiKey;
    const cookie = request.headers.get('cookie');
    if (cookie) headers['Cookie'] = cookie;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const backendResponse = await fetch(`${baseUrl}/api/payment/transactions`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text().catch(() => 'Unknown error');
      logger.error('GET /api/payment/transactions backend error', {
        status: backendResponse.status,
        error: errorText,
      });
      return NextResponse.json(
        { error: true, message: 'Не удалось загрузить историю платежей' },
        { status: backendResponse.status || 500 },
      );
    }

    const raw = await backendResponse.json().catch(() => ({}));
    const data = Array.isArray(raw?.data) ? raw.data : [];

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error(
      'GET /api/payment/transactions',
      { error: error instanceof Error ? error.message : 'Unknown' },
      error instanceof Error ? error : undefined,
    );
    return NextResponse.json(
      { error: true, message: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
