import { decodeToken, TOKEN_KEY } from '@/shared/lib/auth';
import { logger } from '@/shared/lib/logger';
import { applyRateLimit } from '@/shared/middleware/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/payment/methods/[id]
 * Удалить способ оплаты
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Rate limiting: 10 запросов в минуту на IP
  const rateLimitResponse = await applyRateLimit(request, {
    limit: 10,
    window: 60,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: true, message: 'ID способа оплаты обязателен' },
        { status: 400 },
      );
    }

    // Получаем userId из токена
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = request.cookies.get(TOKEN_KEY)?.value || null;
    }

    if (token) {
      try {
        const payload = decodeToken(token);
        if (payload) {
          userId = payload.userId || payload.id || null;
        }
      } catch (error) {
        logger.warn('Failed to decode token', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // В production требуем обязательную аутентификацию через JWT
    if (!userId && process.env.NODE_ENV === 'production') {
      logger.warn('DELETE /api/payment/methods: Unauthorized access attempt in production');
      return NextResponse.json({ error: true, message: 'Необходима авторизация' }, { status: 401 });
    }

    // Fallback только для development: заголовок x-user-id (НЕ query параметр)
    if (!userId && process.env.NODE_ENV !== 'production') {
      userId = request.headers.get('x-user-id');
      if (userId) {
        logger.info('Using x-user-id header in development mode', { userId });
      } else {
        logger.warn('DELETE /api/payment/methods: userId not found, allowing in development');
      }
    }

    logger.info('Deleting payment method', { userId, paymentMethodId: id });

    // Получаем базовый URL для backend API
    const baseUrl =
      typeof process.env.NEXT_PUBLIC_API_URL === 'string'
        ? process.env.NEXT_PUBLIC_API_URL
        : 'http://localhost:8000';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const internalApiKey = process.env.INTERNAL_API_KEY;
    if (internalApiKey) {
      headers['X-Internal-Api-Key'] = internalApiKey;
    }
    const cookie = request.headers.get('cookie');
    if (cookie) {
      headers['Cookie'] = cookie;
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Отправляем запрос на backend
    const backendResponse = await fetch(`${baseUrl}/api/payment/methods/${id}`, {
      method: 'DELETE',
      headers,
      cache: 'no-store',
    });

    if (!backendResponse.ok) {
      // 404 - способ оплаты не найден (уже удален или не существует)
      if (backendResponse.status === 404) {
        logger.info('Payment method not found (already deleted)', { userId, paymentMethodId: id });
        return NextResponse.json({
          success: true,
          data: undefined,
        });
      }

      const errorText = await backendResponse.text().catch(() => 'Unknown error');
      logger.error('Error deleting payment method from backend', {
        userId,
        paymentMethodId: id,
        status: backendResponse.status,
        error: errorText,
      });

      return NextResponse.json(
        {
          error: true,
          message: 'Не удалось удалить способ оплаты',
        },
        { status: backendResponse.status || 500 },
      );
    }

    logger.info('Payment method deleted successfully', { userId, paymentMethodId: id });

    return NextResponse.json({
      success: true,
      data: undefined,
    });
  } catch (error) {
    logger.error(
      'Error deleting payment method',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      error instanceof Error ? error : undefined,
    );

    return NextResponse.json(
      {
        error: true,
        message: error instanceof Error ? error.message : 'Внутренняя ошибка сервера',
      },
      { status: 500 },
    );
  }
}
