import { RotateCcw, Search } from 'lucide-react';
import type { MusicSort, SearchMode } from '@/lib/music/client';
import type { MusicListResponse } from '@/lib/music/schemas';
import styles from '../filters.module.css';

type MusicFiltersProps = {
  readonly query: string;
  readonly searchMode: SearchMode;
  readonly genre: string;
  readonly language: string;
  readonly workType: string;
  readonly sort: MusicSort;
  readonly facets: MusicListResponse['facets'];
  readonly onQueryChange: (value: string) => void;
  readonly onSearchModeChange: (value: SearchMode) => void;
  readonly onGenreChange: (value: string) => void;
  readonly onLanguageChange: (value: string) => void;
  readonly onWorkTypeChange: (value: string) => void;
  readonly onSortChange: (value: MusicSort) => void;
  readonly onReset: () => void;
};

export const MusicFilters = ({
  query,
  searchMode,
  genre,
  language,
  workType,
  sort,
  facets,
  onQueryChange,
  onSearchModeChange,
  onGenreChange,
  onLanguageChange,
  onWorkTypeChange,
  onSortChange,
  onReset
}: MusicFiltersProps) => (
  <div className={styles.stack}>
    <div className={styles.searchPanel}>
      <fieldset className={styles.searchMode}>
        <legend className={styles.srOnly}>搜索方式</legend>
        <button
          type="button"
          aria-pressed={searchMode === 'title'}
          onClick={() => onSearchModeChange('title')}
        >
          按歌曲
        </button>
        <button
          type="button"
          aria-pressed={searchMode === 'artist'}
          onClick={() => onSearchModeChange('artist')}
        >
          按作者
        </button>
      </fieldset>
      <label className={styles.searchField}>
        <span>{searchMode === 'artist' ? '按作者搜索' : '按歌曲名称搜索'}</span>
        <span className={styles.inputWrap}>
          <Search aria-hidden="true" size={18} />
          <input
            type="search"
            value={query}
            placeholder={searchMode === 'artist' ? '输入歌手或作者' : '输入歌名，例如：同花顺'}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </span>
      </label>
    </div>

    <fieldset className={styles.filterPanel}>
      <legend className={styles.srOnly}>排序与筛选</legend>
      <div className={styles.filterGrid}>
        <label>
          <span>排序方式</span>
          <select value={sort} onChange={(event) => onSortChange(event.target.value as MusicSort)}>
            <option value="title">歌曲名称</option>
            <option value="recent">最近演唱时间</option>
            <option value="count">演唱次数</option>
          </select>
        </label>
        <label>
          <span>歌曲类型</span>
          <select value={genre} onChange={(event) => onGenreChange(event.target.value)}>
            <option value="">全部类型</option>
            {facets.genres.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          <span>歌曲语言</span>
          <select value={language} onChange={(event) => onLanguageChange(event.target.value)}>
            <option value="">全部语言</option>
            {facets.languages.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          <span>作品属性</span>
          <select value={workType} onChange={(event) => onWorkTypeChange(event.target.value)}>
            <option value="">原创与翻唱</option>
            {facets.workTypes.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button className={styles.reset} type="button" onClick={onReset}>
          <RotateCcw aria-hidden="true" size={17} />
          重置
        </button>
      </div>
    </fieldset>
  </div>
);
