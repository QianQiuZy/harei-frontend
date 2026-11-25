'use client';

import { useCallback, useSyncExternalStore } from 'react';

const zero = () => 0;

export function useSecondsLeft(until: number) {
  const remaining = useCallback(() => Math.max(0, Math.ceil((until - Date.now()) / 1000)), [until]);
  const subscribe = useCallback(
    (notify: () => void) => {
      if (until <= Date.now()) return () => {};
      const timer = window.setInterval(() => {
        notify();
        if (Date.now() >= until) window.clearInterval(timer);
      }, 200);
      document.addEventListener('visibilitychange', notify);
      return () => {
        window.clearInterval(timer);
        document.removeEventListener('visibilitychange', notify);
      };
    },
    [until]
  );
  return useSyncExternalStore(subscribe, remaining, zero);
}
