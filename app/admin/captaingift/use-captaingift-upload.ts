'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { CaptaingiftImageStatus } from './components';

type UploadResponse = {
  readonly code?: number;
  readonly detail?: string;
  readonly message?: string;
};

type CaptaingiftUploadState = {
  readonly imageStatus: CaptaingiftImageStatus;
  readonly onDeleteSuccess: () => void;
  readonly selectedMonth: string;
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

export function useCaptaingiftUpload({
  imageStatus,
  onDeleteSuccess,
  selectedMonth
}: CaptaingiftUploadState) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        headers: { Authorization: `Bearer ${token}` },
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
      setTimeout(() => window.location.reload(), 1200);
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
      onDeleteSuccess();
      setStatusMessage('删除成功');
    } catch {
      setStatusMessage('删除失败，请稍后重试');
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    file,
    handleDelete,
    handleFileSelection,
    handleSubmit,
    isDeleting,
    isSubmitting,
    reset: () => {
      setFile(null);
      setStatusMessage('');
    },
    setFile,
    statusMessage
  };
}
