import type { PaymentMethod } from '@/shared/api/services/payment-service';
import { decodeToken, TOKEN_KEY } from '@/shared/lib/auth';
import { logger } from '@/shared/lib/logger';
import { applyRateLimit } from '@/shared/middleware/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route для работы со способами оплаты
 * GET /api/payment/methods - получить список сохраненных способов оплаты
 * POST /api/payment/methods - добавить новый способ оплаты
 */

/**
 * GET /api/payment/methods
 * Получить список сохраненных способов оплаты пользователя
 */
export async function GET(request: NextRequest) {
  // Rate limiting: 20 запросов в минуту на IP
  const rateLimitResponse = await applyRateLimit(request, {
    limit: 20,
    window: 60,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Получаем userId из JWT токена
    let userId: string | null = null;

    // Пробуем получить токен из заголовка Authorization (Bearer token)
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback: токен из cookies
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
      logger.warn('GET /api/payment/methods: Unauthorized access attempt in production');
      return NextResponse.json({ error: true, message: 'Необходима авторизация' }, { status: 401 });
    }

    // Fallback только для development: заголовок x-user-id (НЕ query параметр)
    if (!userId && process.env.NODE_ENV !== 'production') {
      userId = request.headers.get('x-user-id');
      if (userId) {
        logger.info('Using x-user-id header in development mode', { userId });
      }
    }

    if (!userId) {
      logger.info('Returning empty array in development mode (no userId)');
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    logger.info('Fetching payment methods', { userId });

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
    // Без internal key бэкенд идёт в auth() — туда должны дойти cookie/Bearer пользователя.
    const cookie = request.headers.get('cookie');
    if (cookie) {
      headers['Cookie'] = cookie;
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Запрос к backend API для получения способов оплаты
    const backendResponse = await fetch(`${baseUrl}/api/payment/methods?userId=${userId}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
      next: {
        revalidate: 0,
      },
    });

    if (!backendResponse.ok) {
      // Если backend вернул 404, возвращаем пустой массив (у пользователя еще нет сохраненных карт)
      if (backendResponse.status === 404) {
        logger.info('No payment methods found for user', { userId });
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      const errorText = await backendResponse.text().catch(() => 'Unknown error');
      logger.error('Error fetching payment methods from backend', {
        userId,
        status: backendResponse.status,
        error: errorText,
      });

      return NextResponse.json(
        {
          error: true,
          message: 'Не удалось получить способы оплаты',
        },
        { status: backendResponse.status || 500 },
      );
    }

    // Парсим ответ от backend
    let paymentMethods: PaymentMethod[] = [];
    try {
      const backendData = await backendResponse.json();
      // Backend может вернуть { data: [...] } или просто массив
      if (Array.isArray(backendData)) {
        paymentMethods = backendData;
      } else if (backendData?.data && Array.isArray(backendData.data)) {
        paymentMethods = backendData.data;
      } else if (backendData?.paymentMethods && Array.isArray(backendData.paymentMethods)) {
        paymentMethods = backendData.paymentMethods;
      }

      // Валидация и нормализация данных
      paymentMethods = paymentMethods
        .filter((method): method is PaymentMethod => {
          // Проверяем обязательные поля
          return (
            typeof method === 'object' &&
            method !== null &&
            typeof method.id === 'string' &&
            typeof method.paymentMethodId === 'string' &&
            typeof method.lastFour === 'string' &&
            typeof method.brand === 'string'
          );
        })
        .map((method) => ({
          ...method,
          type: method.type || 'card', // По умолчанию card
          isDefault: method.isDefault || false,
          isVerified: method.isVerified ?? true,
          expiryMonth: typeof method.expiryMonth === 'number' ? method.expiryMonth : 0,
          expiryYear: typeof method.expiryYear === 'number' ? method.expiryYear : 0,
          createdAt: method.createdAt || new Date().toISOString(),
        }));
    } catch (jsonError) {
      logger.warn('Failed to parse backend response, returning empty array', {
        userId,
        error: jsonError instanceof Error ? jsonError.message : jsonError,
      });
      paymentMethods = [];
    }

    logger.info('Payment methods fetched successfully', {
      userId,
      count: paymentMethods.length,
    });

    return NextResponse.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    logger.error(
      'Error fetching payment methods',
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

/**
 * POST /api/payment/methods
 * Disabled: attaching arbitrary paymentMethodId via BFF is unsafe.
 * Cards are upserted server-side after a verified YooKassa payment.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: true,
      success: false,
      message:
        'Добавление карты через этот endpoint отключено. Карта сохраняется после успешной оплаты.',
      code: 'PAYMENT_METHOD_POST_DISABLED',
    },
    { status: 410 },
  );
}
