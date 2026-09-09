import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const imagePath = 'uploads/captaingift/202608_content-hash.jpg';
const requestUrl = `http://localhost/api/captaingift-image?path=${encodeURIComponent(imagePath)}`;

const imageResponse = (body: string) =>
  new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'image/jpeg' }
  });

describe('captaingift image cache validation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('proxies an image path with long-lived cache headers', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(imageResponse('image-v1'));
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(new Request(requestUrl));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      `http://127.0.0.1:6555/captaingift/image?path=${encodeURIComponent(imagePath)}`,
      { cache: 'no-store' }
    );
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(await response.text()).toBe('image-v1');
  });
});
