import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('server-side emoji listing proxy', () => {
  it('fetches the backend through the private server origin', async () => {
    vi.stubEnv('HAREI_BACKEND_API_URL', 'http://backend.internal:6555///');
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('{"code":0,"groups":{}}', {
        headers: { 'Content-Type': 'application/json' }
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { GET } = await import('./route');
    const response = await GET();

    expect(fetchMock).toHaveBeenCalledWith('http://backend.internal:6555/emoji', {
      cache: 'no-store'
    });
    expect(response.status).toBe(200);
  });

  it('keeps the browser-facing API base on the public host', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.harei.cn');
    const { API_BASE_URL } = await import('@/lib/api');

    expect(API_BASE_URL).toBe('https://api.harei.cn');
  });
});
