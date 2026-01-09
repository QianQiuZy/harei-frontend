'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type UploadResponse = {
  code?: number;
  detail?: string;
  message?: string;
};

const API_HOST = 'https://api.harei.cn';
const TOKEN_KEY = 'harei-admin-token';
const TOKEN_EXPIRES_KEY = 'harei-admin-token-expires';
const MIN_MONTH_NUMBER = 202407;
const SAVED_MONTH_KEY = 'harei-admin-captaingift-month';

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
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageStatus, setImageStatus] = useState<'idle' | 'loading' | 'available' | 'missing' | 'error'>(
    'idle'
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    const savedMonth = sessionStorage.getItem(SAVED_MONTH_KEY);
    if (savedMonth && monthOptions.includes(savedMonth)) {
      setSelectedMonth(savedMonth);
    }
    if (savedMonth) {
      sessionStorage.removeItem(SAVED_MONTH_KEY);
    }
  }, [monthOptions]);

  useEffect(() => {
    if (!selectedMonth) {
      return;
    }

    const controller = new AbortController();

    const fetchImage = async () => {
      setImageStatus('loading');
      try {
        const response = await fetch(`${API_HOST}/captaingift/image?month=${selectedMonth}`, {
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
      } catch (error) {
        if (!controller.signal.aborted) {
          setImageStatus('error');
        }
      }
    };

    fetchImage();

    return () => {
      controller.abort();
    };
  }, [selectedMonth]);

  const imageUrl = useMemo(() => {
    if (!selectedMonth) {
      return '';
    }
    return `${API_HOST}/captaingift/image?month=${selectedMonth}`;
  }, [selectedMonth]);

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
      } catch (error) {
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
    } catch (error) {
      setStatusMessage('上传失败，请稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showUpload = imageStatus === 'missing' || imageStatus === 'error';

  return (
    <section className="admin-page admin-captaingift-page">
      <div className="admin-captaingift-card">
        <header className="admin-captaingift-header">
          <div className="admin-captaingift-select-wrap">
            <select
              className="admin-captaingift-select"
              value={selectedMonth}
              onChange={(event) => {
                setSelectedMonth(event.target.value);
                setFile(null);
                setStatusMessage('');
              }}
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          {statusMessage ? <span className="admin-captaingift-status">{statusMessage}</span> : null}
        </header>

        <div className="admin-captaingift-body">
          {imageStatus === 'loading' ? (
            <div className="captaingift-status">正在加载...</div>
          ) : imageStatus === 'available' ? (
            <div className="captaingift-image-wrap">
              <img
                src={imageUrl}
                alt={`${selectedMonth} 舰礼留档`}
                className="captaingift-image"
                loading="lazy"
              />
            </div>
          ) : showUpload ? (
            <div className="admin-captaingift-upload">
              {imageStatus === 'error' ? (
                <div className="captaingift-status is-error">图片加载失败</div>
              ) : null}
              <div
                className={`box-upload${isDragOver ? ' is-dragover' : ''}${file ? ' has-files' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);
                  const droppedFile = event.dataTransfer.files[0];
                  if (droppedFile) {
                    handleFileSelection(droppedFile);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <div className="box-upload-title">拖拽/点击上传图片(仅限1张)</div>
                {file ? (
                  <div className="admin-captaingift-file-row">
                    <span className="admin-captaingift-file-name">{file.name}</span>
                    <button
                      type="button"
                      className="admin-captaingift-file-remove"
                      onClick={(event) => {
                        event.stopPropagation();
                        setFile(null);
                      }}
                    >
                      移除
                    </button>
                  </div>
                ) : (
                  <div className="admin-captaingift-file-hint">支持常见图片格式</div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="box-upload-input"
                  accept="image/*"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0];
                    if (selectedFile) {
                      handleFileSelection(selectedFile);
                    }
                    event.target.value = '';
                  }}
                />
              </div>
              <button
                type="button"
                className="admin-captaingift-submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                提交
              </button>
            </div>
          ) : (
            <div className="captaingift-status">暂无内容</div>
          )}
        </div>
      </div>
    </section>
  );
}
