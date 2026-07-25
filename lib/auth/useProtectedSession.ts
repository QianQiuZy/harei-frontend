'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  | { readonly status: 'denied' };

export const useProtectedSession = (
  requiredScope: RequiredScope,
  loginPath: string
): ProtectedSessionState => {
  const router = useRouter();
  const [state, setState] = useState<ProtectedSessionState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    const check = async () => {
      const selected = selectSession(requiredScope, window.localStorage);
      if (!selected) {
        if (active) setState({ status: 'denied' });
        router.replace(loginPath);
        return;
      }
      try {
        const remote = await verifySession(selected.session.token);
        if (!remote.scopes.includes(requiredScope)) {
          clearSession(selected.kind, window.localStorage);
          if (active) setState({ status: 'denied' });
          router.replace(loginPath);
          return;
        }
        if (active) setState({ status: 'ready', ...selected });
      } catch {
        clearSession(selected.kind, window.localStorage);
        if (active) setState({ status: 'denied' });
        router.replace(loginPath);
      }
    };
    void check();
    return () => {
      active = false;
    };
  }, [loginPath, requiredScope, router]);

  return state;
};
