import { afterEach, expect, it, vi } from 'vitest';
import { memberFetch } from './member';

afterEach(() => vi.unstubAllGlobals());

it.each(['/me', '/me/account'])('sends %s as a simple credentialed GET', async (path) => {
  const fetch = vi.fn().mockResolvedValue(Response.json({}));
  vi.stubGlobal('fetch', fetch);

  await memberFetch(path);

  expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
    method: 'GET', headers: {}, credentials: 'include', cache: 'no-store'
  }));
});

it('keeps the origin-check marker on a JSON write', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({}));
  vi.stubGlobal('fetch', fetch);

  await memberFetch('/me/address-preference', { auto_fill_address: true }, 'PUT');

  expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
    method: 'PUT', headers: { 'X-Harei-Request': '1', 'Content-Type': 'application/json' }
  }));
});

it('keeps the verification flow in a simple POST body', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({}));
  vi.stubGlobal('fetch', fetch);
  const flow = 'test-flow-token';

  await memberFetch('/user-auth/verification-status', flow);

  expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/verification-status$/), expect.objectContaining({
    method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: flow
  }));
});
