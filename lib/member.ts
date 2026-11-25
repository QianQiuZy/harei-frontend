import { API_BASE_URL } from './api-origin';

export type Address = { name: string; phone: string; address: string };
export const formatAddress = (a: Address) => [a.name, a.phone, a.address].join(' · ');
export type Gift = {
  collection_status: string;
  month: string;
  uid: string;
  nickname: string;
  tier: string;
  roster_tier: string | null;
  needs_reship: boolean;
  state: string;
  waived: boolean;
  has_address: boolean;
  deadline: string | null;
  grace_until: string | null;
  frozen_at: string | null;
  refill_requested: boolean;
  tracking: string | null;
};
export type Profile = {
  email: string;
  address: Address | null;
  auto_fill_address: boolean;
  bindings: { uid: string; username: string | null; address: Address | null }[];
  gifts: (Gift & {
    username: string | null;
    address: Address | null;
    returned_address: Address | null;
  })[];
};

export type SecurityAction = 'change-password' | 'change-email' | 'delete-account';
export function isSecurityAction(action: unknown): action is SecurityAction {
  return action === 'change-password' || action === 'change-email' || action === 'delete-account';
}

export function personalQuery(uid: unknown, section: unknown): string {
  const params = new URLSearchParams();
  if (typeof uid === 'string' && /^[1-9][0-9]{0,19}$/.test(uid)) params.set('uid', uid);
  if (
    section === 'address' ||
    section === 'bindings' ||
    section === 'security' ||
    isSecurityAction(section)
  )
    params.set('section', section);
  return params.size ? '?' + params.toString() : '';
}

export function personalDestination(query: string): string {
  const section = new URLSearchParams(query).get('section');
  if (isSecurityAction(section)) return '/account/' + section;
  if (section === 'bindings' || section === 'security') return '/personal/' + section;
  return '/personal' + query;
}

export const timeLabel = (value: string | null) => value?.replace('T', ' ').slice(0, 16) ?? '—';

export function lastEditableMinute(deadline: string) {
  // Deadlines are exclusive Beijing wall times. Format the last minute available to the user.
  return new Date(Date.parse(deadline + 'Z') - 1).toISOString().slice(0, 16).replace('T', ' ');
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter = 0
  ) {
    super(message);
  }
}

const sessionChangeKey = 'harei-member-session-change';
const sessionActions = new Set([
  '/user-auth/login', '/user-auth/logout', '/user-auth/register', '/user-auth/password-reset',
  '/me/password', '/me/email', '/me/deletion'
]);

export function onMemberSessionChange(refresh: () => void) {
  const changed = (event: StorageEvent) => {
    if (event.key === sessionChangeKey || event.key === null) refresh();
  };
  const restored = (event: PageTransitionEvent) => {
    if (event.persisted) refresh();
  };
  window.addEventListener('storage', changed);
  window.addEventListener('pageshow', restored);
  return () => {
    window.removeEventListener('storage', changed);
    window.removeEventListener('pageshow', restored);
  };
}

export async function memberFetch(
  path: string,
  data?: unknown,
  method?: string,
  adminToken?: string
) {
  const headers: Record<string, string> = { 'X-Harei-Request': '1' };
  const multipart = data instanceof FormData;
  if (data !== undefined && !multipart) headers['Content-Type'] = 'application/json';
  if (adminToken) headers.Authorization = 'Bearer ' + adminToken;
  const res = await fetch(API_BASE_URL + path, {
    method: method ?? (data === undefined ? 'GET' : 'POST'),
    headers,
    credentials: 'include',
    cache: 'no-store',
    redirect: 'error',
    body: multipart ? data : data === undefined ? undefined : JSON.stringify(data)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const message =
      typeof error.detail === 'string'
        ? error.detail
        : res.status === 422
          ? '请检查输入的格式和长度'
          : '请求未完成';
    throw new ApiError(res.status, message, Number(res.headers.get('Retry-After')) || 0);
  }
  if (sessionActions.has(path) && typeof window !== 'undefined') {
    // Announce a change to other tabs without persisting any account information.
    try { window.localStorage.setItem(sessionChangeKey, crypto.randomUUID()); } catch { /* Storage can be disabled. */ }
  }
  return res;
}

export async function request<T = { ok: boolean }>(
  path: string,
  data?: unknown,
  method?: string,
  token?: string
): Promise<T> {
  return (await memberFetch(path, data, method, token)).json();
}
