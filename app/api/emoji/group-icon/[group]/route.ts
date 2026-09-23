import { NextResponse } from 'next/server';
import { emojiNameFromFile } from '@/lib/box/emojis';
import { SERVER_API_BASE_URL } from '@/lib/server-api';

const isSafeSegment = (value: string) =>
  value.length > 0 && value !== '.' && value !== '..' && !value.includes('/') && !value.includes('\\');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ group: string }> }
) {
  const { group: filename } = await params;
  const group = emojiNameFromFile(filename);
  if (!isSafeSegment(filename) || !group || !isSafeSegment(group)) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${SERVER_API_BASE_URL}/emoji/group-icon/${encodeURIComponent(group)}`,
      { cache: 'no-store' }
    );
    const headers = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);
    headers.set('Cache-Control', response.ok ? 'public, max-age=3600' : 'no-store');
    return new NextResponse(response.body, { status: response.status, headers });
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json({ error: 'Emoji service unavailable' }, { status: 502 });
    }
    throw error;
  }
}
