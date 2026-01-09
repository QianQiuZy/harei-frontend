import { NextResponse } from 'next/server';

const API_HOST = 'https://api.harei.cn';
const CACHE_CONTROL = 'private, max-age=300, stale-while-revalidate=600';
const TYPE_MAP: Record<string, string> = {
  thumb: 'thumb',
  jpg: 'jpg',
  original: 'original'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const path = searchParams.get('path');
  const token = searchParams.get('token');

  if (!type || !path || !token || !TYPE_MAP[type]) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  const targetUrl = `${API_HOST}/box/image/${TYPE_MAP[type]}?path=${encodeURIComponent(path)}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const headers = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    headers.set('Cache-Control', CACHE_CONTROL);

    return new NextResponse(response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    return NextResponse.json({ error: 'proxy failed' }, { status: 502 });
  }
}
