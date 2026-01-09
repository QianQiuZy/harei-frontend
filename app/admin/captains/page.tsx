'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type CaptainItem = {
  uid: string;
  name: string;
  level: string;
  count: number;
  joined_at: string;
};

type CaptainResponse = {
  code: number;
  items: CaptainItem[];
};

type ErrorResponse = {
  detail?: string;
};

const API_HOST = 'https://api.harei.cn';
const TOKEN_KEY = 'harei-admin-token';
const TOKEN_EXPIRES_KEY = 'harei-admin-token-expires';
const MIN_MONTH_NUMBER = 202601;

const formatMonthNumber = (value: number) => {
  const year = Math.floor(value / 100);
  const month = String(value % 100).padStart(2, '0');
  return `${year}${month}`;
};

const getMonthNumber = (date: Date) => date.getFullYear() * 100 + (date.getMonth() + 1);

const decrementMonth = (value: number) => {
  const year = Math.floor(value / 100);
  const month = value % 100;
  if (month === 1) {
    return (year - 1) * 100 + 12;
  }
  return year * 100 + (month - 1);
};

const buildMonthOptions = (startMonth: number) => {
  const months: string[] = [];
  let current = startMonth;
  while (current >= MIN_MONTH_NUMBER) {
    months.push(formatMonthNumber(current));
    if (current === MIN_MONTH_NUMBER) {
      break;
    }
    current = decrementMonth(current);
  }
  return months;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export default function AdminCaptainsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<CaptainItem[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const currentMonthNumber = useMemo(() => getMonthNumber(new Date()), []);
  const defaultMonthNumber = useMemo(
    () => Math.max(currentMonthNumber, MIN_MONTH_NUMBER),
    [currentMonthNumber]
  );
  const monthOptions = useMemo(() => buildMonthOptions(defaultMonthNumber), [defaultMonthNumber]);
  const [selectedMonth, setSelectedMonth] = useState(() => formatMonthNumber(defaultMonthNumber));

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_KEY));

    if (!storedToken || !expiresAt || Number.isNaN(expiresAt) || Date.now() > expiresAt) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRES_KEY);
      router.replace('/login');
      return;
    }

    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    const fetchCaptains = async () => {
      setIsLoading(true);
      setStatusMessage('');

      try {
        const response = await fetch(`${API_HOST}/captains?month=${selectedMonth}`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error('fetch failed');
        }

        const data = (await response.json()) as CaptainResponse;
        if (data.code !== 0) {
          throw new Error('fetch failed');
        }
        setItems(data.items ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          setItems([]);
          setStatusMessage('获取舰长列表失败，请稍后重试');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchCaptains();

    return () => {
      controller.abort();
    };
  }, [selectedMonth, token]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const timeA = new Date(a.joined_at).getTime();
      const timeB = new Date(b.joined_at).getTime();
      return timeA - timeB;
    });
  }, [items]);

  const handleDownload = async () => {
    if (!token) {
      router.replace('/login');
      return;
    }

    setIsDownloading(true);
    setStatusMessage('');

    try {
      const response = await fetch(`${API_HOST}/captains/xlsx?month=${selectedMonth}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMessage = '下载失败，请稍后重试';
        try {
          const data = (await response.json()) as ErrorResponse;
          if (typeof data.detail === 'string' && data.detail.trim()) {
            errorMessage = data.detail;
          }
        } catch (error) {
          errorMessage = '下载失败，请稍后重试';
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `captains-${selectedMonth}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatusMessage('表格下载已开始');
    } catch (error) {
      const message = error instanceof Error ? error.message : '下载失败，请稍后重试';
      setStatusMessage(message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="admin-page admin-captains-page">
      <div className="admin-captains-card">
        <header className="admin-captains-header">
          <div>
            <h1 className="admin-captains-title">舰长列表</h1>
            <p className="admin-captains-subtitle">按月份查看舰长上舰记录</p>
          </div>
          {statusMessage ? <span className="admin-captains-status">{statusMessage}</span> : null}
        </header>
        <div className="admin-captains-toolbar">
          <label className="admin-captains-month">
            <span>月份</span>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="admin-captains-download"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            下载表格
          </button>
        </div>
        <div className="admin-captains-table-wrapper">
          <table className="admin-captains-table">
            <thead>
              <tr>
                <th>UID</th>
                <th>名称</th>
                <th>等级</th>
                <th>数量</th>
                <th>上舰时间</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="admin-captains-empty">
                    加载中...
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-captains-empty">
                    暂无上舰记录
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr key={`${item.uid}-${item.joined_at}`}>
                    <td>{item.uid}</td>
                    <td>{item.name}</td>
                    <td>{item.level}</td>
                    <td>{item.count}</td>
                    <td>{formatDateTime(item.joined_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
