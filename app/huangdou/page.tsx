'use client';

import { useEffect, useMemo, useState } from 'react';

type HuangdouRankItem = {
  uid: string;
  name: string;
  count: number;
};

type HuangdouRankResponse = {
  code: number;
  items: HuangdouRankItem[];
};

type HuangdouUidResponse = {
  code: number;
  uid: string;
  name: string;
  count: number;
};

type HuangdouErrorResponse = {
  detail?: string;
};

const MAX_UID_LENGTH = 16;

const sanitizeUid = (value: string) => value.replace(/\D/g, '').slice(0, MAX_UID_LENGTH);

export default function HuangdouPage() {
  const [items, setItems] = useState<HuangdouRankItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uidInput, setUidInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRank = async () => {
      try {
        const response = await fetch('https://api.harei.cn/huangdou/rank', {
          cache: 'no-store'
        });
        if (!response.ok) {
          throw new Error('rank request failed');
        }
        const data = (await response.json()) as HuangdouRankResponse;
        if (isMounted) {
          setItems(Array.isArray(data.items) ? data.items : []);
          setError(null);
        }
      } catch (fetchError) {
        if (isMounted) {
          setItems([]);
          setError('豆力榜加载失败，请稍后再试。');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRank();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.count - a.count),
    [items]
  );

  const handleUidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUidInput(sanitizeUid(event.target.value));
  };

  const handleCheck = async () => {
    if (!uidInput || isChecking) {
      return;
    }

    setIsChecking(true);
    setCheckMessage(null);

    try {
      const response = await fetch(
        `https://api.harei.cn/huangdou/uid?uid=${encodeURIComponent(uidInput)}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error('uid request failed');
      }

      const data = (await response.json()) as HuangdouUidResponse | HuangdouErrorResponse;

      if ('detail' in data && data.detail === 'Not found') {
        setCheckMessage('未找到用户的豆力修炼值');
        return;
      }

      if ('name' in data && 'uid' in data && 'count' in data) {
        setCheckMessage(`用户名: ${data.name} ,UID: ${data.uid}, 豆力修炼值: ${data.count}`);
        return;
      }

      setCheckMessage('未找到用户的豆力修炼值');
    } catch (requestError) {
      setCheckMessage('未找到用户的豆力修炼值');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="huangdou-page">
      <div className="huangdou-box">
        <div className="huangdou-header">
          <img
            src="/images/icon/huangdou.png"
            alt="黄豆"
            className="huangdou-icon"
          />
          <div className="huangdou-title">豆力巅峰榜</div>
        </div>

        {isLoading ? (
          <div className="huangdou-state">豆力榜加载中...</div>
        ) : error ? (
          <div className="huangdou-state huangdou-error">{error}</div>
        ) : sortedItems.length === 0 ? (
          <div className="huangdou-state">暂无榜单数据</div>
        ) : (
          <>
            <table className="huangdou-table">
              <thead>
                <tr>
                  <th className="huangdou-col-name">用户名</th>
                  <th className="huangdou-col-uid">UID</th>
                  <th className="huangdou-col-count">豆力修练值</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => (
                  <tr key={`${item.uid}-${item.name}`}>
                    <td>{item.name}</td>
                    <td>{item.uid}</td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="huangdou-list">
              <li className="huangdou-list-header">
                <span className="huangdou-list-name">用户名</span>
                <span className="huangdou-list-count">豆力修炼值</span>
              </li>
              {sortedItems.map((item) => (
                <li key={`${item.uid}-${item.name}`}>
                  <span className="huangdou-list-name">{item.name}</span>
                  <span className="huangdou-list-count">{item.count}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="huangdou-check">
          <div className="huangdou-check-title">检测豆力修炼值</div>
          <input
            className="huangdou-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="请输入UID"
            value={uidInput}
            onChange={handleUidChange}
            aria-label="输入UID"
          />
          <button
            type="button"
            className="huangdou-button"
            onClick={handleCheck}
            disabled={!uidInput || isChecking}
          >
            {isChecking ? '检测中...' : '检测'}
          </button>
          {checkMessage ? (
            <div className="huangdou-result">{checkMessage}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
