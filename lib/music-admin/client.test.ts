import ky from 'ky';
import { describe, expect, it } from 'vitest';
import { isMusicVersionConflict } from '@/lib/music-admin/client';

describe('music management conflicts', () => {
  it('recognizes a 409 Ky HTTP error', async () => {
    const conflict = await ky('https://example.test/conflict', {
      fetch: async () => new Response(null, { status: 409 }),
      retry: 0
    }).catch((reason: unknown) => reason);

    expect(isMusicVersionConflict(conflict)).toBe(true);
  });
});
