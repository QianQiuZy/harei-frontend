'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

type AuthResponse = {
  code: number;
  authenticated: boolean;
};

const TOKEN_KEY = 'harei-admin-token';
const TOKEN_EXPIRES_KEY = 'harei-admin-token-expires';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_KEY));

      if (!token || !expiresAt || Number.isNaN(expiresAt) || Date.now() > expiresAt) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRES_KEY);
        router.replace('/login');
        return;
      }

      try {
        const response = await fetch('https://api.harei.cn/auth', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('auth failed');
        }

        const data = (await response.json()) as AuthResponse;
        if (data.code !== 0 || !data.authenticated) {
          throw new Error('auth failed');
        }
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRES_KEY);
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
}
