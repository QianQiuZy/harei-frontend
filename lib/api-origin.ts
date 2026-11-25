const productionUrl = (
  process.env.NEXT_PUBLIC_PRODUCTION_API_URL?.trim() || 'https://api.harei.cn'
).replace(/\/+$/, '');
const localUrl = process.env.NEXT_PUBLIC_LOCAL_API_URL?.trim() || 'http://localhost:6555';
const mode = process.env.NEXT_PUBLIC_API_MODE?.trim() || 'auto';
if (!['auto', 'local', 'production'].includes(mode))
  throw new Error('Invalid NEXT_PUBLIC_API_MODE');
const local = mode === 'local' || (mode === 'auto' && process.env.NODE_ENV !== 'production');

function browserLocalUrl() {
  const url = new URL(localUrl);
  const host = typeof window === 'undefined' ? '' : window.location.hostname;
  // Keep session cookies on the same loopback host as the page.
  if (['localhost', '127.0.0.1'].includes(host) && ['localhost', '127.0.0.1'].includes(url.hostname)) {
    url.hostname = host;
  }
  return url.toString();
}

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || (local ? browserLocalUrl() : productionUrl)
).replace(/\/+$/, '');

// Stored links can still point to the public API when the client uses a local backend.
export function resolveApiLink(link: string) {
  const value = link.trim();
  if (!/^(?:https?:)?\/\//i.test(value)) return link;
  try {
    const url = new URL(value, API_BASE_URL);
    if (url.origin === new URL(productionUrl).origin || url.hostname === 'api.harei.cn') {
      return API_BASE_URL + url.pathname + url.search + url.hash;
    }
  } catch {
    return link;
  }
  return link;
}
