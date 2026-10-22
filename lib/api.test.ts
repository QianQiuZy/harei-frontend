import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('API client URL resolution', () => {
  it.each(['https://example.test', 'https://example.test/backend/'])(
    'keeps requests below the configured API prefix %s',
    async (baseUrl) => {
      vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', baseUrl);
      const { apiClient } = await import('@/lib/api');
      const requests: Request[] = [];
      const client = apiClient.extend({
        fetch: async (input) => {
          requests.push((input as Request).clone());
          return Response.json({ code: 0 });
        }
      });

      await client.get('music', { searchParams: { page: 2 } });
      await client.post('music-manage/songs', {
        headers: { Authorization: 'Bearer test-token' },
        json: { title: 'Test song' }
      });

      const prefix = baseUrl.replace(/\/+$/, '');
      expect(requests[0].url).toBe(`${prefix}/music?page=2`);
      expect(requests[1].url).toBe(`${prefix}/music-manage/songs`);
      expect(requests[1].headers.get('authorization')).toBe('Bearer test-token');
      expect(await requests[1].json()).toEqual({ title: 'Test song' });
    }
  );
});
