import { NextResponse } from 'next/server';
import { SERVER_API_BASE_URL } from '@/lib/server-api';

const CACHE_CONTROL_OK = 'public, max-age=31536000, immutable';

const isSafeFilename = (filename: string) =>
  filename.length > 0 && filename !== '.' && filename !== '..' && !filename.includes('/') && !filename.includes('\\');

const withCorsHeaders = (headers: Headers) => {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const headers = new Headers();
  withCorsHeaders(headers);

  if (!isSafeFilename(filename) || !/\.jpe?g$/i.test(filename)) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400, headers });
  }

  const imagePath = `uploads/captaingift/${filename}`;
  const targetUrl = `${SERVER_API_BASE_URL}/captaingift/image?path=${encodeURIComponent(imagePath)}`;

  try {
    const response = await fetch(targetUrl, { cache: 'no-store', redirect: 'error' });

    const contentType = response.headers.get('content-type');
    if (response.ok && !/^image\/jpeg(?:;|$)/i.test(contentType ?? '')) {
      await response.body?.cancel();
      headers.set('Cache-Control', 'no-store');
      return NextResponse.json({ error: 'invalid image' }, { status: 502, headers });
    }
    if (contentType) headers.set('Content-Type', contentType);

    const versioned = /^[0-9]{6}_[0-9a-f]{64}\.jpg$/.test(filename);
    headers.set('Cache-Control', response.ok && versioned ? CACHE_CONTROL_OK : 'no-store');
    return new NextResponse(response.body, { status: response.status, headers });
  } catch {
    headers.set('Cache-Control', 'no-store');
    return NextResponse.json({ error: 'proxy failed' }, { status: 502, headers });
  }
}
