import { useEffect, useRef } from 'react';
import { ExternalLink, X } from 'lucide-react';
import type { SongDetailResponse } from '@/lib/music/schemas';
import styles from '../dialog.module.css';

type SongDialogProps = {
  readonly open: boolean;
  readonly loading: boolean;
  readonly detail: SongDetailResponse['item'] | null;
  readonly error: string | null;
  readonly onClose: () => void;
};

const shortDate = (value: string): string => {
  const [, month = '', day = ''] = value.split('-');
  return `${Number(month)}.${Number(day)}`;
};

export const SongDialog = ({ open, loading, detail, error, onClose }: SongDialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="song-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div className={styles.shell}>
        <button className={styles.close} type="button" aria-label="关闭歌曲详情" onClick={onClose}>
          <X aria-hidden="true" size={20} />
        </button>
        {loading ? <p className={styles.state}>正在整理演唱记录…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        {detail ? (
          <>
            <header className={styles.hero}>
              <p>SONG FILE</p>
              <h2 id="song-dialog-title">{detail.title}</h2>
              <span>{detail.artist}</span>
            </header>
            <div className={styles.body}>
              <ul className={styles.tags} aria-label="歌曲信息">
                <li>{detail.genre}</li>
                <li>{detail.language}</li>
                <li>{detail.workType}</li>
              </ul>
              {detail.notes ? <p className={styles.notes}>{detail.notes}</p> : null}
              <div className={styles.historyHeading}>
                <h3>历史演唱记录</h3>
                <p>共 {detail.performanceCount} 次</p>
              </div>
              <ol className={styles.historyList}>
                {detail.performances.map((performance) => (
                  <li className={styles.historyItem} key={performance.id}>
                    <time dateTime={performance.date}>
                      <strong>{shortDate(performance.date)}</strong>
                      {performance.date.slice(0, 4)}
                    </time>
                    <div>
                      <strong>
                        {performance.stream.platform} · {performance.stream.id ?? '同日直播'}
                      </strong>
                      <span>{performance.stream.title ?? '直播记录'}</span>
                    </div>
                    {performance.clipUrl ? (
                      <a href={performance.clipUrl} target="_blank" rel="noreferrer noopener">
                        听歌切
                        <ExternalLink aria-hidden="true" size={14} />
                      </a>
                    ) : (
                      <span className={styles.missing}>歌切待补</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </>
        ) : null}
      </div>
    </dialog>
  );
};
