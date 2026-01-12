import { NextResponse } from 'next/server';

const API_HOST = 'https://api.harei.cn';
const CACHE_CONTROL = 'private, max-age=300, stale-while-revalidate=600';

const withCorsHeaders = (headers: Headers) => {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');

  if (!month) {
    const headers = new Headers();
    withCorsHeaders(headers);
    return NextResponse.json({ error: 'invalid request' }, { status: 400, headers });
  }

  const targetUrl = `${API_HOST}/captaingift/image?month=${encodeURIComponent(month)}`;

  try {
    const response = await fetch(targetUrl, { cache: 'no-store' });
    const buffer = await response.arrayBuffer();
    const headers = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    headers.set('Cache-Control', CACHE_CONTROL);
    withCorsHeaders(headers);

    return new NextResponse(buffer, {
      status: response.status,
      headers
    });
  } catch (error) {
    const headers = new Headers();
    withCorsHeaders(headers);
    return NextResponse.json({ error: 'proxy failed' }, { status: 502, headers });
  }
}
