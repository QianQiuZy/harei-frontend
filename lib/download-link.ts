import { API_BASE_URL, resolveApiLink } from './api-origin';

export function isDownloadId(value: string | null): value is string {
  return value !== null && /^[1-9]\d{0,19}$/.test(value);
}

export function downloadLink(path: unknown) {
  if (typeof path !== 'string') return null;
  const value = path.trim();
  const external = /^(?:https?:)?\/\//i.test(value);
  if ((!external && !value.startsWith('/')) || value.includes('\\')) return null;
  try {
    const source = new URL(value, API_BASE_URL);
    if (!['http:', 'https:'].includes(source.protocol) || source.username || source.password) {
      return null;
    }
    const url = new URL(resolveApiLink(source.href));
    if (
      url.origin === new URL(API_BASE_URL).origin &&
      ['/download/file', '/api/download-file'].includes(url.pathname)
    ) {
      const id = url.searchParams.get('download_id');
      return isDownloadId(id)
        ? { href: '/api/download-file?download_id=' + id, external: false }
        : null;
    }
    return external ? { href: url.href, external: true } : null;
  } catch {
    return null;
  }
}
