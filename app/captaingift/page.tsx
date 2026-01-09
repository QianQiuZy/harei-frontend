'use client';

import { useEffect, useMemo, useState } from 'react';

type CaptaingiftItem = {
  month: string;
  path: string;
};

type CaptaingiftResponse = {
  code: number;
  items: CaptaingiftItem[];
};

export default function CaptaingiftPage() {
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMonths = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://api.harei.cn/captaingift', {
          cache: 'no-store'
        });
        if (!response.ok) {
          throw new Error('captaingift request failed');
        }
        const data = (await response.json()) as CaptaingiftResponse;
        const items = Array.isArray(data.items) ? data.items : [];
        const sortedMonths = items
          .map((item) => item.month)
          .filter(Boolean)
          .sort((a, b) => b.localeCompare(a));

        if (isMounted) {
          setMonths(sortedMonths);
          setSelectedMonth(sortedMonths[0] ?? '');
          setError(null);
        }
      } catch (fetchError) {
        if (isMounted) {
          setMonths([]);
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

  const imageUrl = useMemo(() => {
    if (!selectedMonth) {
      return '';
    }
    return `https://api.harei.cn/captaingift/image?month=${selectedMonth}`;
  }, [selectedMonth]);

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
              <img
                src={imageUrl}
                alt={`${selectedMonth} 舰礼留档`}
                className="captaingift-image"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
