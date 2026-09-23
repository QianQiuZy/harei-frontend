import { NextResponse } from 'next/server';
import { SERVER_API_BASE_URL } from '@/lib/server-api';

export async function GET() {
  try {
    const response = await fetch(`${SERVER_API_BASE_URL}/emoji`, { cache: 'no-store' });
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json({ error: 'Emoji service unavailable' }, { status: 502 });
    }
    throw error;
  }
}
