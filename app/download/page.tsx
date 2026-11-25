'use client';

import { API_BASE_URL } from '@/lib/api-origin';
import { downloadLink } from '@/lib/download-link';
import { useEffect, useState } from 'react';

type DownloadItem = {
  download_id: number;
  description: string;
  path: string;
};

type DownloadResponse = {
  code: number;
  items: DownloadItem[];
};

export default function DownloadPage() {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDownloads = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/download/active`, {
          cache: 'no-store'
        });
        if (!response.ok) {
          throw new Error('download request failed');
        }
        const data = (await response.json()) as DownloadResponse;
        if (isMounted) {
          setItems(Array.isArray(data.items) ? data.items : []);
          setError(null);
        }
      } catch (fetchError) {
        if (isMounted) {
          setItems([]);
          setError('资源列表加载失败，请稍后再试。');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDownloads();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="download-page">
      <div className="download-box">
        <div className="download-header">
          <img
            src="/images/icon/download.png"
            alt="资源下载"
            className="download-icon"
          />
          <div className="download-title">资源下载</div>
        </div>

        {isLoading ? (
          <div className="download-state">资源列表加载中...</div>
        ) : error ? (
          <div className="download-state download-error">{error}</div>
        ) : items.length === 0 ? (
          <div className="download-state">暂无可下载资源</div>
        ) : (
          <div className="download-list">
            {items.map((item) => {
              const link = downloadLink(item.path);
              return (
                <div key={item.download_id} className="download-item">
                  <span className="download-item-name">{item.description}</span>
                  <button
                    type="button"
                    className="download-item-button"
                    disabled={!link}
                    title={link ? undefined : '下载地址无效'}
                    onClick={() => {
                      if (link?.external) window.open(link.href, '_blank', 'noopener,noreferrer');
                      else if (link) window.location.assign(link.href);
                    }}
                  >
                    下载
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
