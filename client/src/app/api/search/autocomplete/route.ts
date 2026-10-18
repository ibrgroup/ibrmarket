import type { Product } from '@/entities/product/model/types';
import { DEFAULT_POPULAR_SEARCHES } from '@/shared/lib/constants/popularSearch';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') ?? '').trim();
    const limitRaw = searchParams.get('limit');
    // Number(null) возвращает 0, а isNaN(0) = false, поэтому нужна явная проверка
    const limit =
      !limitRaw || limitRaw.trim() === '' || isNaN(Number(limitRaw)) ? 5 : Number(limitRaw);

    // Если запрос пустой, отдаём популярные поиски
    if (!query) {
      return NextResponse.json({
        success: true,
        data: {
          suggestions: [],
          popular: DEFAULT_POPULAR_SEARCHES,
          recentlySearched: [],
        },
      });
    }

    // Делаем запрос к бэкенду для получения подсказок
    try {
      // ✅ Используем новый оптимизированный эндпоинт для автокомплита
      // Примечание: если бэкенд требует POST, измените method и передайте данные в body

      // Создаем AbortController для timeout (совместимо со всеми версиями Node.js)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const backendResponse = await fetch(
        `${BACKEND_URL}/api/product/search/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Добавляем timeout для предотвращения зависания (совместимо со всеми версиями Node.js)
          signal: controller.signal,
        },
      );

      // Очищаем timeout после получения ответа
      clearTimeout(timeoutId);

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();

        // ✅ Новый эндпоинт возвращает suggestions напрямую
        const suggestions = Array.isArray(backendData.suggestions)
          ? backendData.suggestions
          : // Fallback на старый формат для совместимости
            Array.isArray(backendData.products)
            ? backendData.products.slice(0, limit).map((product: Product) => ({
                id: product._id?.toString() ?? '',
                title: product.name ?? '',
                category: product.catName ?? product.category?.name ?? '',
              }))
            : [];

        return NextResponse.json({
          success: true,
          data: {
            suggestions,
            popular: DEFAULT_POPULAR_SEARCHES, // Возвращаем популярные запросы
            recentlySearched: [],
          },
        });
      } else {
        // Неудачный ответ от бэкенда — логгируем текст и падения:
        const errorText = await backendResponse.text();
        // Используем console.error только в dev, в production лучше логировать аккуратней
        if (process.env.NODE_ENV === 'development') {
          console.error('Autocomplete backend error:', backendResponse.status, errorText);
        }
      }
    } catch (backendError) {
      if (process.env.NODE_ENV === 'development') {
        const errorMessage =
          backendError instanceof Error ? backendError.message : String(backendError);
        console.error('Ошибка запроса к бэкенду:', errorMessage);

        // Проверяем, не является ли это ошибкой timeout или соединения
        if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
          // eslint-disable-next-line no-console
          console.warn('Запрос к бэкенду превысил время ожидания или был отменен');
        }
      }
      // Fallback на популярные поиски при ошибке
      return NextResponse.json({
        success: true,
        data: {
          suggestions: [],
          popular: DEFAULT_POPULAR_SEARCHES,
          recentlySearched: [],
        },
      });
    }

    // Fallback: если ответ не получен, но не было throw - отдаём пустое, без популярных
    return NextResponse.json({
      success: true,
      data: {
        suggestions: [],
        popular: [],
        recentlySearched: [],
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Ошибка автозаполнения поиска:', error);
    }
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
