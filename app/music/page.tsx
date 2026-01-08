'use client';

import { useEffect, useMemo, useState } from 'react';

type MusicItem = {
  music_id: number;
  title: string;
  artist: string;
  type: string;
  language?: string;
  note?: string;
};

type MusicResponse = {
  code: number;
  items: MusicItem[];
};

export default function MusicPage() {
  const [items, setItems] = useState<MusicItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMusic = async () => {
      try {
        const response = await fetch('https://api.harei.cn/music', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('music request failed');
        }
        const data = (await response.json()) as MusicResponse;
        if (isMounted) {
          setItems(Array.isArray(data.items) ? data.items : []);
          setError(null);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError('歌单加载失败，请稍后再试。');
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMusic();

    return () => {
      isMounted = false;
    };
  }, []);

  const typeOptions = useMemo(() => {
    const options = new Set<string>();
    items.forEach((item) => {
      if (item.type) {
        options.add(item.type);
      }
    });
    return Array.from(options);
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return items.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.artist.toLowerCase().includes(keyword);
      const matchesType = !selectedType || item.type === selectedType;
      return matchesKeyword && matchesType;
    });
  }, [items, searchText, selectedType]);

  return (
    <div className="music-page">
      <div className="music-box">
        <div className="music-controls">
          <input
            className="music-search"
            type="search"
            placeholder="搜索歌曲名称或歌手"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            aria-label="搜索歌曲名称或歌手"
          />
          <select
            className="music-select"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            aria-label="选择风格"
          >
            <option value="">选择风格</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="music-state">歌单加载中...</div>
        ) : error ? (
          <div className="music-state music-error">{error}</div>
        ) : filteredItems.length === 0 ? (
          <div className="music-state">暂无匹配歌曲</div>
        ) : (
          <>
            <table className="music-table">
              <thead>
                <tr>
                  <th className="music-col-title">歌曲名称</th>
                  <th className="music-col-artist">歌手</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.music_id}>
                    <td>{item.title}</td>
                    <td>{item.artist}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="music-list">
              {filteredItems.map((item) => (
                <li key={item.music_id}>
                  <img
                    src="/images/icon/music.png"
                    alt=""
                    className="music-item-icon"
                  />
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
