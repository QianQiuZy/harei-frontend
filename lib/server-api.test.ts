import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('server-side backend URL', () => {
  it('defaults to the backend loopback listener', async () => {
    vi.stubEnv('HAREI_BACKEND_API_URL', '');
    const { SERVER_API_BASE_URL } = await import('./server-api');

    expect(SERVER_API_BASE_URL).toBe('http://127.0.0.1:6555');
  });

  it('removes trailing slashes from a configured internal URL', async () => {
    vi.stubEnv('HAREI_BACKEND_API_URL', 'http://harei-backend.internal:6555///');
    const { SERVER_API_BASE_URL } = await import('./server-api');

    expect(SERVER_API_BASE_URL).toBe('http://harei-backend.internal:6555');
  });
});
