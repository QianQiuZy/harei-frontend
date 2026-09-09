'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { buildCaptaingiftImageUrl } from '@/lib/captaingift-image';

import {
  CaptaingiftHeader,
  type CaptaingiftImageStatus,
  CaptaingiftUpload
} from './components';

type UploadResponse = {
  code?: number;
  detail?: string;
  message?: string;
};

type CaptaingiftItem = {
  readonly month: string;
  readonly path: string;
};

type CaptaingiftResponse = {
  readonly code: number;
  readonly items: CaptaingiftItem[];
};

const API_HOST = 'https://api.harei.cn';
const TOKEN_KEY = 'harei-admin-token';
const TOKEN_EXPIRES_KEY = 'harei-admin-token-expires';
const SAVED_MONTH_KEY = 'harei-admin-captaingift-month';

const getErrorMessage = (data: UploadResponse | null) => {
  if (!data) {
    return '上传失败，请稍后再试';
  }
  if (typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail;
  }
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }
  return '上传失败，请稍后再试';
};

export default function AdminCaptaingiftPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageStatus, setImageStatus] = useState<CaptaingiftImageStatus>('idle');
  const [archiveItems, setArchiveItems] = useState<CaptaingiftItem[]>([]);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isArchiveLoading, setIsArchiveLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const monthOptions = useMemo(() => archiveItems.map((item) => item.month), [archiveItems]);
  const selectedItem = useMemo(
    () => archiveItems.find((item) => item.month === selectedMonth),
    [archiveItems, selectedMonth]
  );

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
    const controller = new AbortController();

    const fetchArchive = async () => {
      setIsArchiveLoading(true);
      try {
        const response = await fetch('/api/captaingift', {
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
        const savedMonth = sessionStorage.getItem(SAVED_MONTH_KEY);
        const nextMonth = savedMonth && data.items.some((item) => item.month === savedMonth)
          ? savedMonth
          : data.items[0]?.month ?? '';
        setSelectedMonth(nextMonth);
        sessionStorage.removeItem(SAVED_MONTH_KEY);
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
  }, []);

  useEffect(() => {
    if (!selectedItem?.path) {
      setImageStatus('idle');
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

    return () => {
      controller.abort();
    };
  }, [selectedItem?.path]);

  const imageUrl = useMemo(() => {
    if (!selectedItem?.path) {
      return '';
    }
    return buildCaptaingiftImageUrl(selectedItem.path);
  }, [selectedItem?.path]);

  const handleFileSelection = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setStatusMessage('请上传图片文件');
      return;
    }
    setFile(selectedFile);
    setStatusMessage('');
  };

  const handleSubmit = async () => {
    if (!file) {
      setStatusMessage('请上传图片');
      return;
    }

    if (!token) {
      router.replace('/login');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const formData = new FormData();
      formData.append('month', selectedMonth);
      formData.append('file', file);

      const response = await fetch(`${API_HOST}/captaingift/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      let responseData: UploadResponse | null = null;
      try {
        responseData = (await response.json()) as UploadResponse;
      } catch {
        responseData = null;
      }

      if (!response.ok || responseData?.code !== 0) {
        setStatusMessage(getErrorMessage(responseData));
        return;
      }

      setStatusMessage('上传成功');
      sessionStorage.setItem(SAVED_MONTH_KEY, selectedMonth);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch {
      setStatusMessage('上传失败，请稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!token || imageStatus !== 'available') {
      return;
    }

    if (!window.confirm(`确定删除 ${selectedMonth} 的舰礼留档吗？`)) {
      return;
    }

    setIsDeleting(true);
    setStatusMessage('');

    try {
      const response = await fetch(`${API_HOST}/captaingift/delete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ month: selectedMonth })
      });

      let responseData: UploadResponse | null = null;
      try {
        responseData = (await response.json()) as UploadResponse;
      } catch {
        responseData = null;
      }

      if (!response.ok || responseData?.code !== 0) {
        setStatusMessage('删除失败，请稍后重试');
        return;
      }

      setFile(null);
      setImageStatus('missing');
      setStatusMessage('删除成功');
    } catch {
      setStatusMessage('删除失败，请稍后重试');
    } finally {
      setIsDeleting(false);
    }
  };

  const showUpload = imageStatus === 'missing' || imageStatus === 'error';

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setFile(null);
    setStatusMessage('');
  };

  return (
    <section className="admin-page admin-captaingift-page">
      <div className="admin-captaingift-card">
        <CaptaingiftHeader
          selectedMonth={selectedMonth}
          monthOptions={monthOptions}
          imageStatus={imageStatus}
          statusMessage={statusMessage}
          isDeleting={isDeleting}
          isSubmitting={isSubmitting}
          onMonthChange={handleMonthChange}
          onDelete={handleDelete}
        />

        <div className="admin-captaingift-body">
          {isArchiveLoading || imageStatus === 'loading' ? (
            <div className="captaingift-status">正在加载...</div>
          ) : archiveError ? (
            <div className="captaingift-status is-error">{archiveError}</div>
          ) : imageStatus === 'available' ? (
            <div className="captaingift-image-wrap">
              <Image
                src={imageUrl}
                alt={`${selectedMonth} 舰礼留档`}
                className="captaingift-image"
                width={1200}
                height={800}
                sizes="(max-width: 640px) 90vw, 40vw"
                unoptimized
              />
            </div>
          ) : showUpload ? (
            <>
              {imageStatus === 'error' ? (
                <div className="captaingift-status is-error">图片加载失败</div>
              ) : null}
              <CaptaingiftUpload
                file={file}
                isSubmitting={isSubmitting}
                onFileSelection={handleFileSelection}
                onFileRemove={() => setFile(null)}
                onSubmit={handleSubmit}
              />
            </>
          ) : (
            <div className="captaingift-status">暂无内容</div>
          )}
        </div>
      </div>
    </section>
  );
}
