'use client';

import { useEffect, useSyncExternalStore } from 'react';

const TOKEN_KEY = 'harei-admin-token';
const EXPIRES_KEY = 'harei-admin-token-expires';

const getSnapshot = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY));
  return token && expiresAt && Number.isFinite(expiresAt) && Date.now() <= expiresAt ? token : null;
};

const getServerSnapshot = () => null;
const subscribe = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};

export const useLegacyAdminToken = () => {
  const token = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (getSnapshot()) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    window.location.replace('/login');
  }, [token]);

  return token;
};
