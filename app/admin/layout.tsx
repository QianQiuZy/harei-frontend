'use client';

import type { ReactNode } from 'react';
import { ADMIN_SCOPE } from '@/lib/auth/session';
import { useProtectedSession } from '@/lib/auth/useProtectedSession';

export default function AdminLayout({ children }: { readonly children: ReactNode }) {
  const session = useProtectedSession(ADMIN_SCOPE, '/login');
  if (session.status === 'unavailable') {
    return <div className="admin-loading" role="alert">暂时无法验证后台权限。 <button onClick={session.retry}>重试</button></div>;
  }
  if (session.status !== 'ready') {
    return <div className="admin-loading">正在验证后台权限…</div>;
  }
  return <>{children}</>;
}
