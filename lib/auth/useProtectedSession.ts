'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HTTPError } from 'ky';
import {
  clearSession,
  selectSession,
  verifySession,
  type RequiredScope,
  type SessionKind,
  type StoredSession
} from '@/lib/auth/session';

type ProtectedSessionState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly kind: SessionKind; readonly session: StoredSession }
  | { readonly status: 'denied' }
  | { readonly status: 'unavailable'; readonly retry: () => void };

export const useProtectedSession = (
  requiredScope: RequiredScope,
  loginPath: string
): ProtectedSessionState => {
  const router = useRouter();
  const [state, setState] = useState<ProtectedSessionState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    let generation = 0;

    const check = async () => {
      const current = ++generation;
      const selected = selectSession(requiredScope, window.localStorage);
      if (!selected) {
        setState({ status: 'denied' });
        router.replace(loginPath);
        return;
      }
      setState({ status: 'loading' });
      const isCurrent = () => active && generation === current &&
        selectSession(requiredScope, window.localStorage)?.session.token === selected.session.token;
      try {
        const remote = await verifySession(selected.session.token);
        if (!isCurrent()) return;
        if (remote.scopes.includes(requiredScope)) {
          setState({ status: 'ready', ...selected });
          return;
        }
      } catch (err) {
        if (!isCurrent()) return;
        if (!(err instanceof HTTPError && [401, 403].includes(err.response.status))) {
          setState({ status: 'unavailable', retry: () => void check() });
          return;
        }
      }
      clearSession(selected.kind, window.localStorage);
      void check();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith('harei-admin-token') ||
          event.key.startsWith('harei-music-admin-token')) void check();
    };
    window.addEventListener('storage', onStorage);
    void check();
    return () => {
      active = false;
      window.removeEventListener('storage', onStorage);
    };
  }, [loginPath, requiredScope, router]);

  return state;
};
