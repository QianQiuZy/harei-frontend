import { describe, expect, it } from 'vitest';
import { downloadLink } from './download-link';

describe('resource download destinations', () => {
  it('uses the Next.js proxy for relative and stored public API download paths', () => {
    for (const path of [
      '/download/file?download_id=21',
      'https://api.harei.cn/download/file?download_id=21'
    ]) {
      expect(downloadLink(path)).toEqual({
        href: '/api/download-file?download_id=21',
        external: false
      });
    }
  });
  it('opens external web resources at their own origin', () => {
    const href = 'https://example.test/file.zip?download_id=21';
    expect(downloadLink(href)).toEqual({ href, external: true });
  });
  it.each([
    null,
    '/download/file?download_id=abc',
    '/unrelated',
    'https://member@api.harei.cn/download/file?download_id=21',
    'ftp://example.test/file',
    'https://'
  ])('disables an invalid destination %s', (path) => expect(downloadLink(path)).toBeNull());
});
