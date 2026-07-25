import { z } from 'zod';
import { apiClient } from '@/lib/api';

export const ADMIN_SCOPE = 'admin' as const;
export const MUSIC_SCOPE = 'music:manage' as const;
export type RequiredScope = typeof ADMIN_SCOPE | typeof MUSIC_SCOPE;

const sessionResponseSchema = z.object({
  code: z.number(),
  token: z.string().min(1).optional(),
  authenticated: z.boolean().optional(),
  user: z.object({ username: z.string() }),
  scopes: z.array(z.string()),
  expires_at: z.iso.datetime()
});

const storedSessionSchema = z.object({
  token: z.string().min(1),
  scopes: z.array(z.string()),
  expiresAt: z.number().finite()
});

export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type StoredSession = z.infer<typeof storedSessionSchema>;
export type SessionKind = 'admin' | 'music';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const SESSION_KEYS = {
  admin: {
    token: 'harei-admin-token',
    expires: 'harei-admin-token-expires',
    scopes: 'harei-admin-token-scopes'
  },
  music: {
    token: 'harei-music-admin-token',
    expires: 'harei-music-admin-token-expires',
    scopes: 'harei-music-admin-token-scopes'
  }
} as const;

export const parseSessionResponse = (value: unknown): SessionResponse =>
  sessionResponseSchema.parse(value);

export const saveSession = (
  kind: SessionKind,
  response: SessionResponse,
  storage: StorageLike
): StoredSession => {
  if (!response.token) {
    throw new Error('登录响应缺少 Token');
  }
  const session = storedSessionSchema.parse({
    token: response.token,
    scopes: response.scopes,
    expiresAt: Date.parse(response.expires_at)
  });
  const keys = SESSION_KEYS[kind];
  storage.setItem(keys.token, session.token);
  storage.setItem(keys.expires, String(session.expiresAt));
  storage.setItem(keys.scopes, JSON.stringify(session.scopes));
  return session;
};

export const clearSession = (kind: SessionKind, storage: StorageLike): void => {
  const keys = SESSION_KEYS[kind];
  storage.removeItem(keys.token);
  storage.removeItem(keys.expires);
  storage.removeItem(keys.scopes);
};

export const readSession = (kind: SessionKind, storage: StorageLike): StoredSession | null => {
  const keys = SESSION_KEYS[kind];
  const token = storage.getItem(keys.token);
  const expiresAt = Number(storage.getItem(keys.expires));
  const rawScopes = storage.getItem(keys.scopes);
  if (!token || !rawScopes || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    clearSession(kind, storage);
    return null;
  }
  try {
    const parsed = storedSessionSchema.safeParse({
      token,
      expiresAt,
      scopes: JSON.parse(rawScopes)
    });
    if (!parsed.success) {
      clearSession(kind, storage);
      return null;
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      clearSession(kind, storage);
      return null;
    }
    throw error;
  }
};

const permits = (session: StoredSession, requiredScope: RequiredScope): boolean =>
  session.scopes.includes(requiredScope);

export const selectSession = (
  requiredScope: RequiredScope,
  storage: StorageLike
): { readonly kind: SessionKind; readonly session: StoredSession } | null => {
  const adminSession = readSession('admin', storage);
  if (adminSession && permits(adminSession, requiredScope)) {
    return { kind: 'admin', session: adminSession };
  }
  if (requiredScope === MUSIC_SCOPE) {
    const musicSession = readSession('music', storage);
    if (musicSession && permits(musicSession, MUSIC_SCOPE)) {
      return { kind: 'music', session: musicSession };
    }
  }
  return null;
};

export const login = async (
  kind: SessionKind,
  username: string,
  password: string
): Promise<SessionResponse> => {
  const path = kind === 'admin' ? 'login' : 'music-manage/login';
  const payload = await apiClient.post(path, { json: { username, password } }).json<unknown>();
  return parseSessionResponse(payload);
};

export const verifySession = async (token: string): Promise<SessionResponse> => {
  const payload = await apiClient
    .get('auth', { headers: { Authorization: `Bearer ${token}` } })
    .json<unknown>();
  return parseSessionResponse(payload);
};

export const revokeSession = async (token: string): Promise<void> => {
  await apiClient.post('logout', { headers: { Authorization: `Bearer ${token}` } });
};
