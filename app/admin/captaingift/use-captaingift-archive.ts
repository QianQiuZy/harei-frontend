'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [imageStatus, setImageStatus] = useState<CaptaingiftImageStatus>('idle');

  const monthOptions = useMemo(
    () => buildCaptaingiftMonthOptions(archiveItems, currentMonth),
    [archiveItems, currentMonth]
  );
  const selectedItem = useMemo(
    () => archiveItems.find((item) => item.month === selectedMonth),
    [archiveItems, selectedMonth]
  );

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
    if (!selectedMonth) {
      setImageStatus('idle');
      return;
    }
    if (!selectedItem?.path) {
      setImageStatus('missing');
      return;
    }

    const controller = new AbortController();

    const fetchImage = async () => {
      setImageStatus('loading');
      try {
        const response = await fetch(buildCaptaingiftImageUrl(selectedItem.path), {
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
  }, [selectedItem?.path, selectedMonth]);

  const imageUrl = useMemo(() => {
    if (!selectedItem?.path) {
      return '';
    }
    return buildCaptaingiftImageUrl(selectedItem.path);
  }, [selectedItem?.path]);

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
