import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

describe('captaingift archive proxy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the archive API same-origin for callers', async () => {
    const payload = JSON.stringify({
      code: 0,
      items: [{ month: '202608', path: 'uploads/captaingift/202608_content-hash.jpg' }]
    });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(payload, { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET();

    expect(fetchMock).toHaveBeenCalledWith('https://api.harei.cn/captaingift', {
      cache: 'no-store'
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual(JSON.parse(payload));
  });
});
