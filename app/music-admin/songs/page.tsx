'use client';

import { Archive, ChevronLeft, ChevronRight, Download, Plus, Search, Upload } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMusicAdminSession } from '@/app/music-admin/_components/SessionContext';
import {
  downloadPerformanceTemplate,
  importPerformances,
  listManagedSongs,
  MusicImportError
} from '@/lib/music-admin/client';
import type { ManagedSongList } from '@/lib/music-admin/schemas';
import styles from '../admin.module.css';

export default function ManagedSongsPage() {
  const { session } = useMusicAdminSession();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ManagedSongList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void listManagedSongs(session.token, { q: query.trim() || undefined, status: status || undefined, page })
        .then((value) => { if (active) setData(value); })
        .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : '歌曲加载失败'); });
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [page, query, session.token, status]);

  const downloadTemplate = async () => {
    setImportMessage(null);
    try {
      const blob = await downloadPerformanceTemplate(session.token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'harei-performance-import-template.xlsx';
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setImportMessage(reason instanceof Error ? reason.message : '模板下载失败');
    }
  };

  const uploadWorkbook = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const result = await importPerformances(session.token, file);
      setImportMessage(`已导入 ${result.imported_count} 条演唱记录，涉及 ${result.affected_song_count} 首歌曲。`);
      const updated = await listManagedSongs(session.token, {
        q: query.trim() || undefined,
        status: status || undefined,
        page
      });
      setData(updated);
    } catch (reason) {
      if (reason instanceof MusicImportError && reason.issues.length > 0) {
        setImportMessage(reason.issues.map((issue) => `第 ${issue.row} 行 ${issue.field}：${issue.message}`).join('\n'));
      } else {
        setImportMessage(reason instanceof Error ? reason.message : '导入失败');
      }
    } finally {
      event.target.value = '';
      setImporting(false);
    }
  };

  return (
    <section>
      <header className={styles.pageHeading}>
        <div><p>CATALOG</p><h1>歌曲管理</h1></div>
        <div className={styles.headingActions}>
          <button className={styles.secondaryAction} type="button" onClick={() => void downloadTemplate()}>
            <Download size={17} />下载导入模板
          </button>
          <label className={styles.secondaryAction}>
            <Upload size={17} />{importing ? '导入中…' : '导入演唱记录'}
            <input className={styles.srOnly} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={importing} onChange={(event) => void uploadWorkbook(event)} />
          </label>
          <Link className={styles.primaryAction} href="/music-admin/songs/new"><Plus size={17} />新增歌曲</Link>
        </div>
      </header>
      <div className={styles.toolbar}>
        <label className={styles.searchBox}><span className={styles.srOnly}>搜索歌名</span><Search size={17} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="搜索歌名" /></label>
        <label><span className={styles.srOnly}>状态</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">全部状态</option><option value="active">公开</option><option value="archived">已归档</option></select></label>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      {importMessage ? <p className={styles.importMessage} aria-live="polite">{importMessage}</p> : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption>歌曲管理列表</caption>
          <thead><tr><th>歌曲</th><th>来源键</th><th>状态</th><th>版本</th><th>操作</th></tr></thead>
          <tbody>
            {data?.items.map((song) => (
              <tr key={song.song_id}>
                <td data-label="歌曲"><strong>{song.title}</strong><small>{song.artist}</small></td>
                <td data-label="来源键"><code>{song.source_key}</code></td>
                <td data-label="状态"><span className={song.status === 'active' ? styles.activeBadge : styles.archivedBadge}>{song.status === 'active' ? '公开' : '归档'}</span></td>
                <td data-label="版本">{song.version}</td>
                <td data-label="操作"><Link href={`/music-admin/songs/${song.song_id}`}>编辑</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.items.length ? <div className={styles.empty}><Archive size={28} /><span>没有匹配歌曲</span></div> : null}
      </div>
      <footer className={styles.pagination}>
        <span>共 {data?.total ?? 0} 首</span>
        <div><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={17} />上一页</button><span>第 {page} 页</span><button type="button" disabled={!data || page * data.page_size >= data.total} onClick={() => setPage((value) => value + 1)}>下一页<ChevronRight size={17} /></button></div>
      </footer>
    </section>
  );
}
