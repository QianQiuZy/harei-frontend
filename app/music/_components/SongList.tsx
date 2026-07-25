import { ExternalLink } from 'lucide-react';
import type { SongSummary } from '@/lib/music/schemas';
import styles from '../music.module.css';

type SongListProps = {
  readonly songs: readonly SongSummary[];
  readonly loading: boolean;
  readonly onOpen: (song: SongSummary) => void;
};

export const SongList = ({ songs, loading, onOpen }: SongListProps) => {
  if (!loading && songs.length === 0) {
    return (
      <div className={styles.empty} role="status">
        <strong>这张歌单里暂时没有</strong>
        <span>换个关键词，或减少一些筛选条件试试看。</span>
      </div>
    );
  }

  return (
    <div className={styles.songList} aria-busy={loading}>
        {songs.map((song) => (
          <article className={styles.songCard} key={song.source_key}>
            <button className={styles.songTitle} type="button" onClick={() => onOpen(song)}>
              <span>{song.title}</span>
              <small>
                {song.artist} · {song.performanceCount} 次
              </small>
            </button>
            {song.latestLink ? (
              <a
                className={styles.listenLink}
                href={song.latestLink}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`打开《${song.title}》最近一次演唱歌切`}
              >
                去听
                <ExternalLink aria-hidden="true" size={14} />
              </a>
            ) : (
              <span className={styles.noLink}>暂无链接</span>
            )}
          </article>
        ))}
        {loading
          ? ['first', 'second', 'third'].map((key) => (
              <div className={styles.loadingCard} key={key} />
            ))
          : null}
    </div>
  );
};
