import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const filename = '202608_e30b54b7c3d58a1d32f6e03b8f15a2e678771ad82ef4908719b4eaf214e81ce2.jpg';
const requestUrl = `http://localhost/api/captaingift-image/${filename}`;

const imageResponse = (body: string) =>
  new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'image/jpeg' }
  });

describe('captaingift image cache validation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('proxies a filename path with long-lived cache headers', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(imageResponse('image-v1'));
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(new Request(requestUrl), {
      params: Promise.resolve({ filename })
    });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:6555/captaingift/image?path=uploads%2Fcaptaingift%2F202608_e30b54b7c3d58a1d32f6e03b8f15a2e678771ad82ef4908719b4eaf214e81ce2.jpg',
      { cache: 'no-store' }
    );
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(await response.text()).toBe('image-v1');
  });

  it('rejects a filename containing a path separator', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(new Request('http://localhost/api/captaingift-image/unsafe'), {
      params: Promise.resolve({ filename: '../unsafe.jpg' })
    });

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
