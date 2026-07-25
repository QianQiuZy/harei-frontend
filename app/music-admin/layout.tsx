'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { MusicAdminShell } from '@/app/music-admin/_components/MusicAdminShell';
import { MusicAdminSessionProvider } from '@/app/music-admin/_components/SessionContext';
import { MUSIC_SCOPE } from '@/lib/auth/session';
import { useProtectedSession } from '@/lib/auth/useProtectedSession';
import styles from './admin.module.css';

const ProtectedMusicAdmin = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  const session = useProtectedSession(MUSIC_SCOPE, '/music-admin/login');
  if (session.status !== 'ready') {
    return <div className={styles.gate}>正在验证歌单管理权限…</div>;
  }
  return (
    <MusicAdminSessionProvider value={session}>
      <MusicAdminShell token={session.session.token} kind={session.kind}>
        {children}
      </MusicAdminShell>
    </MusicAdminSessionProvider>
  );
};

export default function MusicAdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === '/music-admin/login') return <>{children}</>;
  return <ProtectedMusicAdmin>{children}</ProtectedMusicAdmin>;
}
