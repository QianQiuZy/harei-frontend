import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  apiClient: { get: getMock }
}));

import { listMusic, type MusicQuery } from '@/lib/music/client';

const query: MusicQuery = {
  sort: 'title',
  order: 'asc',
  page: 1,
  pageSize: 50
};

const payload = {
  code: 0,
  items: [],
  total: 0,
  page: 1,
  page_size: 50,
  facets: { genres: [], languages: [], workTypes: [] },
  stats: { song_count: 0, performance_count: 0 },
  revision: 7
};

describe('public music ETag cache', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('reuses the cached catalog when the server returns 304', async () => {
    getMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ETag: 'W/"music-7"' }
        })
      )
      .mockResolvedValueOnce(new Response(null, { status: 304 }));

    await expect(listMusic(query)).resolves.toEqual(payload);
    await expect(listMusic(query)).resolves.toEqual(payload);
    expect(getMock).toHaveBeenNthCalledWith(
      2,
      'music',
      expect.objectContaining({ headers: { 'If-None-Match': 'W/"music-7"' } })
    );
  });
});
