import { NextResponse } from 'next/server';

const API_HOST = 'https://api.harei.cn';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const downloadId = searchParams.get('download_id');

  if (!downloadId) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  const targetUrl = `${API_HOST}/download/file?download_id=${encodeURIComponent(downloadId)}`;

  try {
    const response = await fetch(targetUrl, { cache: 'no-store' });
    const headers = new Headers();

    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');
    const contentLength = response.headers.get('content-length');

    if (contentType) headers.set('Content-Type', contentType);
    if (contentDisposition) headers.set('Content-Disposition', contentDisposition);
    if (contentLength) headers.set('Content-Length', contentLength);

    headers.set('Cache-Control', 'no-store');

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch {
    return NextResponse.json({ error: 'proxy failed' }, { status: 502 });
  }
}
