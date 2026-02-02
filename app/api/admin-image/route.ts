import { NextResponse } from 'next/server';

const API_HOST = 'https://api.harei.cn';
const CACHE_CONTROL_OK = 'private, max-age=31536000, immutable';

const TYPE_MAP: Record<string, string> = {
  thumb: 'thumb',
  jpg: 'jpg',
  original: 'original',
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
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const headers = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);

    headers.set('Cache-Control', response.ok ? CACHE_CONTROL_OK : 'no-store');

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch {
    return NextResponse.json({ error: 'proxy failed' }, { status: 502 });
  }
}
