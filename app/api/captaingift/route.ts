import { NextResponse } from 'next/server';

const API_HOST = 'https://api.harei.cn';

export async function GET() {
  try {
    const response = await fetch(`${API_HOST}/captaingift`, { cache: 'no-store' });
    const headers = new Headers({ 'Cache-Control': 'no-store' });
    const contentType = response.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    return new NextResponse(response.body, { status: response.status, headers });
  } catch {
    return NextResponse.json({ error: 'proxy failed' }, { status: 502 });
  }
}
