import { describe, expect, it } from 'vitest';
import { ADMIN_SCOPE, MUSIC_SCOPE, saveSession, selectSession } from '@/lib/auth/session';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const response = (token: string, scopes: readonly string[]) => ({
  code: 0,
  token,
  user: { username: token },
  scopes: [...scopes],
  expires_at: new Date(Date.now() + 60_000).toISOString()
});

describe('session selection', () => {
  it('allows admin token to manage music', () => {
    const storage = new MemoryStorage();
    saveSession('admin', response('admin-token', [ADMIN_SCOPE, MUSIC_SCOPE]), storage);
    expect(selectSession(MUSIC_SCOPE, storage)?.session.token).toBe('admin-token');
  });

  it('does not allow music token to enter admin', () => {
    const storage = new MemoryStorage();
    saveSession('music', response('music-token', [MUSIC_SCOPE]), storage);
    expect(selectSession(ADMIN_SCOPE, storage)).toBeNull();
  });
});
