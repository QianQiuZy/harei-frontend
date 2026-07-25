'use client';

import { Archive, Library, ListMusic } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMusicAdminSession } from '@/app/music-admin/_components/SessionContext';
import { getMusicAdminStats } from '@/lib/music-admin/client';
import type { MusicAdminStats } from '@/lib/music-admin/schemas';
import styles from './admin.module.css';

export default function MusicAdminPage() {
  const { session } = useMusicAdminSession();
  const [stats, setStats] = useState<MusicAdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getMusicAdminStats(session.token)
      .then(setStats)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : '统计加载失败'));
  }, [session.token]);

  const cards = [
    { label: '公开歌曲', value: stats?.activeSongs ?? '—', icon: Library },
    { label: '归档歌曲', value: stats?.archivedSongs ?? '—', icon: Archive },
    { label: '演唱记录', value: stats?.performanceCount ?? '—', icon: ListMusic }
  ] as const;

  return (
    <section>
      <header className={styles.pageHeading}>
        <div><p>MUSIC OPERATIONS</p><h1>歌单概览</h1></div>
        <Link className={styles.primaryAction} href="/music-admin/songs/new">新增歌曲</Link>
      </header>
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.statGrid}>
        {cards.map((card) => {
          const Icon = card.icon;
          return <article key={card.label}><Icon aria-hidden="true" /><span>{card.label}</span><strong>{card.value}</strong></article>;
        })}
      </div>
    </section>
  );
}
