'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, ExternalLink, LayoutDashboard, Library, LogOut } from 'lucide-react';
import { clearSession, revokeSession, type SessionKind } from '@/lib/auth/session';
import styles from '../admin.module.css';

const NAV_ITEMS = [
  { href: '/music-admin', label: '概览', icon: LayoutDashboard },
  { href: '/music-admin/songs', label: '歌曲管理', icon: Library },
  { href: '/music-admin/audit', label: '操作记录', icon: ClipboardList }
] as const;

export const MusicAdminShell = ({
  token,
  kind,
  children
}: {
  readonly token: string;
  readonly kind: SessionKind;
  readonly children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    try {
      await revokeSession(token);
    } finally {
      clearSession(kind, window.localStorage);
      router.replace('/music-admin/login');
    }
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/music-admin">
          <strong>HAREI SONGBOOK</strong>
          <span>歌单管理</span>
        </Link>
        <nav className={styles.nav} aria-label="歌单管理导航">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/music-admin' ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
                <Icon aria-hidden="true" size={17} />
                {item.label}
              </Link>
            );
          })}
          <Link href="/music" target="_blank">
            <ExternalLink aria-hidden="true" size={17} />
            公开歌单
          </Link>
          <button type="button" onClick={() => void logout()}>
            <LogOut aria-hidden="true" size={17} />
            退出
          </button>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
};
