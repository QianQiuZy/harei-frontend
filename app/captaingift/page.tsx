'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { buildCaptaingiftImageUrl } from '@/lib/captaingift-image';

type CaptaingiftItem = {
  month: string;
  path: string;
};

type CaptaingiftResponse = {
  code: number;
  items: CaptaingiftItem[];
};

export default function CaptaingiftPage() {
  const [items, setItems] = useState<CaptaingiftItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMonths = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/captaingift', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('captaingift request failed');
        }
        const data = (await response.json()) as CaptaingiftResponse;
        const items = Array.isArray(data.items) ? data.items : [];
        const sortedItems = items
          .filter((item) => item.month)
          .sort((a, b) => b.month.localeCompare(a.month));

        if (isMounted) {
          setItems(sortedItems);
          setSelectedMonth(sortedItems[0]?.month ?? '');
          setError(null);
        }
      } catch {
        if (isMounted) {
          setItems([]);
          setSelectedMonth('');
          setError('数据加载失败');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMonths();

    return () => {
      isMounted = false;
    };
  }, []);

  const months = useMemo(() => items.map((item) => item.month), [items]);
  const selectedItem = useMemo(
    () => items.find((item) => item.month === selectedMonth),
    [items, selectedMonth]
  );
  const imageUrl = useMemo(() => {
    if (!selectedItem?.path) {
      return '';
    }
    return buildCaptaingiftImageUrl(selectedItem.path);
  }, [selectedItem?.path]);

  return (
    <div className="captaingift-page">
      <div className="captaingift-card">
        <div className="captaingift-header">
          <div className="captaingift-select-wrap">
            <select
              className="captaingift-select"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              disabled={isLoading || months.length === 0}
            >
              {months.length === 0 ? (
                <option value="">暂无月份</option>
              ) : (
                months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="captaingift-body">
          {isLoading ? (
            <div className="captaingift-status">正在加载...</div>
          ) : error ? (
            <div className="captaingift-status is-error">{error}</div>
          ) : !selectedMonth ? (
            <div className="captaingift-status">暂无内容</div>
          ) : (
            <div className="captaingift-image-wrap">
              <Image
                src={imageUrl}
                alt={`${selectedMonth} 舰礼留档`}
                className="captaingift-image"
                width={1200}
                height={800}
                sizes="(max-width: 640px) 90vw, 60vw"
                unoptimized
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
