'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, onMemberSessionChange, request } from '@/lib/member';
import { errorText } from './MemberUI';

export function useMemberData<T>(path: '/me' | '/me/account', loginQuery: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const mounted = useRef(false);
  const latest = useRef<{ path: string; response: Promise<T> } | null>(null);

  const clear = useCallback(() => {
    latest.current = null;
    setData(null);
    setError('');
  }, []);

  const reload = useCallback(() => {
    const response = request<T>(path);
    latest.current = { path, response };
    const isCurrent = () => mounted.current && latest.current?.response === response;
    return response.then(
      (result) => {
        if (!isCurrent()) return;
        setData(result);
        setError('');
      },
      (err: unknown) => {
        if (!isCurrent()) return;
        if (err instanceof ApiError && err.status === 401) {
          setData(null);
          window.location.replace('/account/login' + loginQuery);
          return;
        }
        setError(errorText(err));
      }
    );
  }, [path, loginQuery]);

  useEffect(() => {
    mounted.current = true;
    // Reuse the initial request when React replays the mount effect in development.
    if (latest.current?.path !== path) void reload();
    const unsubscribe = onMemberSessionChange(() => {
      clear();
      void reload();
    });
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [clear, path, reload]);

  return { data, error, reload, clear };
}
