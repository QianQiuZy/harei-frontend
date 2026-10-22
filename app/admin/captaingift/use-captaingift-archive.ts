'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { buildCaptaingiftImageUrl } from '@/lib/captaingift-image';
import { buildCaptaingiftMonthOptions } from '@/lib/captaingift-months';

import type { CaptaingiftImageStatus } from './components';

export type CaptaingiftItem = {
  readonly month: string;
  readonly path: string;
};

type CaptaingiftResponse = {
  readonly code: number;
  readonly items: CaptaingiftItem[];
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export function useCaptaingiftArchive() {
  const [currentMonth] = useState(getCurrentMonth);
  const [archiveItems, setArchiveItems] = useState<CaptaingiftItem[]>([]);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isArchiveLoading, setIsArchiveLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [imageResult, setImageResult] = useState<{ key: string; status: CaptaingiftImageStatus } | null>(null);

  const monthOptions = useMemo(
    () => buildCaptaingiftMonthOptions(archiveItems, currentMonth),
    [archiveItems, currentMonth]
  );
  const selectedItem = useMemo(
    () => archiveItems.find((item) => item.month === selectedMonth),
    [archiveItems, selectedMonth]
  );
  const imagePath = selectedItem?.path ?? '';
  const imageRequestKey = `${selectedMonth}:${imagePath}`;
  const imageStatus: CaptaingiftImageStatus = !selectedMonth
    ? 'idle'
    : !imagePath
      ? 'missing'
      : imageResult?.key === imageRequestKey ? imageResult.status : 'loading';
  const setImageStatus = useCallback((status: CaptaingiftImageStatus) => {
    setImageResult({ key: imageRequestKey, status });
  }, [imageRequestKey]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchArchive = async () => {
      setIsArchiveLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/captaingift`, {
          cache: 'no-store',
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`archive request failed: ${response.status}`);
        }

        const data = (await response.json()) as CaptaingiftResponse;
        if (data.code !== 0 || !Array.isArray(data.items)) {
          throw new Error('archive response is invalid');
        }

        setArchiveItems(data.items);
        const savedMonth = sessionStorage.getItem('harei-admin-captaingift-month');
        const availableMonths = buildCaptaingiftMonthOptions(data.items, currentMonth);
        const nextMonth = savedMonth && availableMonths.includes(savedMonth)
          ? savedMonth
          : currentMonth;
        setSelectedMonth(nextMonth);
        sessionStorage.removeItem('harei-admin-captaingift-month');
        setArchiveError(null);
      } catch {
        if (!controller.signal.aborted) {
          setArchiveError('舰礼留档加载失败，请稍后再试');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsArchiveLoading(false);
        }
      }
    };

    fetchArchive();
    return () => controller.abort();
  }, [currentMonth]);

  useEffect(() => {
    if (!selectedMonth || !imagePath) return;

    const controller = new AbortController();

    const fetchImage = async () => {
      try {
        const response = await fetch(buildCaptaingiftImageUrl(imagePath), {
          cache: 'no-store',
          signal: controller.signal
        });

        if (response.ok) {
          setImageStatus('available');
          return;
        }

        if (response.status === 404) {
          setImageStatus('missing');
          return;
        }

        setImageStatus('error');
      } catch {
        if (!controller.signal.aborted) {
          setImageStatus('error');
        }
      }
    };

    fetchImage();

    return () => controller.abort();
  }, [imagePath, selectedMonth, setImageStatus]);

  const imageUrl = imagePath ? buildCaptaingiftImageUrl(imagePath) : '';

  return {
    archiveError,
    imageStatus,
    imageUrl,
    isArchiveLoading,
    monthOptions,
    selectedMonth,
    setImageStatus,
    setSelectedMonth
  };
}
