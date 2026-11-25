import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it('keeps local API cookies on the loopback hostname used to open the site', async () => {
  vi.stubGlobal('window', { location: { hostname: '127.0.0.1' } });
  vi.stubEnv('NEXT_PUBLIC_API_MODE', 'local');
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '');
  vi.stubEnv('NEXT_PUBLIC_LOCAL_API_URL', 'http://localhost:6555');
  expect((await import('./api-origin')).API_BASE_URL).toBe('http://127.0.0.1:6555');
});

it.each([
  ['development', 'auto', 'http://localhost:6555'],
  ['production', 'auto', 'https://api.harei.cn'],
  ['production', 'local', 'http://localhost:6555'],
  ['development', 'production', 'https://api.harei.cn']
] as const)('selects browser and proxy origins in %s / %s', async (nodeEnv, mode, expected) => {
  vi.stubEnv('NODE_ENV', nodeEnv);
  vi.stubEnv('NEXT_PUBLIC_API_MODE', mode);
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '');
  vi.stubEnv('HAREI_BACKEND_API_URL', '');
  const { API_BASE_URL, resolveApiLink } = await import('./api-origin');
  expect(API_BASE_URL).toBe(expected);
  expect(resolveApiLink('https://api.harei.cn/download/file?download_id=17')).toBe(
    expected + '/download/file?download_id=17'
  );
  expect(resolveApiLink('https://www.bilibili.com/video/BV123')).toBe(
    'https://www.bilibili.com/video/BV123'
  );
  expect(resolveApiLink('//api.harei.cn/path?q=1#image')).toBe(expected + '/path?q=1#image');
  expect(resolveApiLink('/music')).toBe('/music');
  expect(resolveApiLink('http://')).toBe('http://');
  expect((await import('./server-api')).SERVER_API_BASE_URL).toBe('http://127.0.0.1:6555');
});
