import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');

    if (!(image instanceof File)) {
      return NextResponse.json(
        { success: false, message: 'Передайте файл image' },
        { status: 400 },
      );
    }

    const upstream = new FormData();
    upstream.append('image', image);

    const backendResponse = await fetch(`${BACKEND_URL}/api/product/search/by-image`, {
      method: 'POST',
      body: upstream,
    });

    const payload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(payload ?? { success: false, message: 'Ошибка поиска по фото' }, {
        status: backendResponse.status,
      });
    }

    return NextResponse.json(payload);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[search/by-image]', error);
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
