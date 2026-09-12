import { NextResponse } from 'next/server';

const API_HOST = 'http://127.0.0.1:6555';
const CACHE_CONTROL_OK = 'private, max-age=31536000, immutable';

const TYPE_MAP = {
  thumb: 'thumb',
  jpg: 'jpg',
  original: 'original'
} as const;

type AdminImageType = keyof typeof TYPE_MAP;

const isAdminImageType = (value: string): value is AdminImageType =>
  Object.keys(TYPE_MAP).includes(value);

const isSafeFilename = (filename: string) =>
  filename.length > 0 && filename !== '.' && filename !== '..' && !filename.includes('/') && !filename.includes('\\');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string; filename: string }> }
) {
  const { type, filename } = await params;
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!isAdminImageType(type) || !isSafeFilename(filename) || !token) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  const backendType = TYPE_MAP[type];
  const imagePath = `uploads/${backendType === 'thumb' ? 'thumbs' : backendType}/${filename}`;
  const targetUrl = `${API_HOST}/box/image/${backendType}?path=${encodeURIComponent(imagePath)}`;

  try {
    const response = await fetch(targetUrl, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const headers = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);

    headers.set('Cache-Control', response.ok ? CACHE_CONTROL_OK : 'no-store');

    return new NextResponse(response.body, {
      status: response.status,
      headers
    });
  } catch {
    return NextResponse.json({ error: 'proxy failed' }, { status: 502 });
  }
}
