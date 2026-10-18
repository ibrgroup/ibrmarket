import { NextRequest, NextResponse } from 'next/server';

const DADATA_API_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';
const DADATA_TOKEN = process.env.DADATA_TOKEN || process.env.NEXT_PUBLIC_DADATA_TOKEN;

export async function POST(request: NextRequest) {
  try {
    if (!DADATA_TOKEN) {
      console.error('❌ [DaData API] Token is not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'DaData token is not configured. Please set DADATA_TOKEN or NEXT_PUBLIC_DADATA_TOKEN environment variable.'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { query, count = 10 } = body;

    console.log('📤 [DaData API] Proxying request:', { query, count });

    const response = await fetch(DADATA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${DADATA_TOKEN}`,
      },
      body: JSON.stringify({
        query: query || '',
        count: count || 10,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [DaData API] Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      return NextResponse.json(
        {
          success: false,
          error: `DaData API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [DaData API] Success:', { suggestionsCount: data.suggestions?.length || 0 });

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('❌ [DaData API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
