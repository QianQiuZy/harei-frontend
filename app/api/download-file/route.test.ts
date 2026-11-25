import { afterEach, expect, it, vi } from 'vitest';
import { GET } from './route';

afterEach(() => vi.unstubAllGlobals());

it('streams downloads as attachments with the actual body framing', async () => {
  const upstream = vi.fn().mockResolvedValue(
    new Response('archive contents', {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': '123',
        'Content-Disposition': 'inline'
      }
    })
  );
  vi.stubGlobal('fetch', upstream);
  const response = await GET(new Request('http://localhost/api/download-file?download_id=17'));
  expect(upstream).toHaveBeenCalledWith('http://127.0.0.1:6555/download/file?download_id=17', {
    cache: 'no-store',
    redirect: 'error'
  });
  expect(response.headers.get('content-length')).toBeNull();
  expect(response.headers.get('content-disposition')).toBe('attachment');
  expect(await response.text()).toBe('archive contents');
});

it('preserves the attachment filename for a valid archive', async () => {
  const disposition = 'attachment; filename="archive.zip"';
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response('archive', {
        headers: { 'Content-Disposition': disposition }
      })
    )
  );
  const response = await GET(new Request('http://localhost/api/download-file?download_id=8'));
  expect(response.headers.get('content-disposition')).toBe(disposition);
});
