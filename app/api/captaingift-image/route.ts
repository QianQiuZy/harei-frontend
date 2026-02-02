import { NextResponse } from 'next/server';

const API_HOST = 'https://api.harei.cn';
const CACHE_CONTROL_OK = 'public, max-age=31536000, immutable';

const withCorsHeaders = (headers: Headers) => {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');

  const headers = new Headers();
  withCorsHeaders(headers);

  if (!month) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400, headers });
  }

  const targetUrl = `${API_HOST}/captaingift/image?month=${encodeURIComponent(month)}`;

  try {
    // 保持 no-store：避免 Next 自己的 fetch cache；真正缓存交给 Nginx/浏览器
    const response = await fetch(targetUrl, { cache: 'no-store' });

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);

    // 只缓存成功响应，避免把 4xx/5xx 缓存 1 年
    headers.set('Cache-Control', response.ok ? CACHE_CONTROL_OK : 'no-store');

    return new NextResponse(buffer, { status: response.status, headers });
  } catch {
    headers.set('Cache-Control', 'no-store');
    return NextResponse.json({ error: 'proxy failed' }, { status: 502, headers });
  }
}
