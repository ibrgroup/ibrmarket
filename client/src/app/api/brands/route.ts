import type { Product } from '@/entities';
import { NextResponse } from 'next/server';

/**
 * GET /api/brands
 * Получить список всех уникальных брендов из продуктов
 */
export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Запрашиваем все продукты (без пагинации для получения полного списка брендов)
    const response = await fetch(`${baseUrl}/api/product/getAllProducts?limit=10000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: {
        revalidate: 3600, // Кэшируем на 1 час
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка загрузки продуктов: ${response.statusText}`);
    }

    const data = await response.json();

    // Извлекаем продукты из различных возможных структур ответа
    let products: Product[] = [];
    if (Array.isArray(data)) {
      products = data;
    } else if (data.products && Array.isArray(data.products)) {
      products = data.products;
    } else if (data.data && Array.isArray(data.data)) {
      products = data.data;
    }

    // Извлекаем уникальные бренды и подсчитываем количество продуктов каждого бренда
    const brandMap = new Map<string, { label: string; count: number }>();

    products.forEach((product: Product) => {
      const brand = product?.brand;
      if (typeof brand === 'string' && brand.trim().length > 0) {
        const brandKey = brand.trim().toLowerCase();
        const brandLabel = brand.trim();

        if (brandMap.has(brandKey)) {
          const existing = brandMap.get(brandKey)!;
          brandMap.set(brandKey, {
            label: existing.label,
            count: existing.count + 1,
          });
        } else {
          brandMap.set(brandKey, {
            label: brandLabel,
            count: 1,
          });
        }
      }
    });

    // Преобразуем Map в массив брендов
    const brands = Array.from(brandMap.entries()).map(([value, { label, count }]) => ({
      value,
      label,
      count,
    }));

    // Сортируем по названию (кириллица + латиница)
    brands.sort((a, b) => a.label.localeCompare(b.label, 'ru'));

    return NextResponse.json(brands, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Ошибка при получении брендов:', error);
    return NextResponse.json(
      {
        error: 'Ошибка при получении брендов',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 },
    );
  }
}
